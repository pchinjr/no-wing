#!/usr/bin/env -S deno run --allow-all

/**
 * no-wing Deno CLI - Q Service Account Manager
 * 
 * This Deno version eliminates Node.js + sudo PATH issues:
 * - Single binary installation
 * - No node_modules or build step
 * - System-wide availability
 * - Built-in TypeScript support
 */

import { parseArgs } from "https://deno.land/std@0.208.0/cli/parse_args.ts";
import * as colors from "https://deno.land/std@0.208.0/fmt/colors.ts";

// Types
interface ProjectType {
  type: 'SAM' | 'CDK' | 'GENERIC';
  name: string;
  configFile?: string;
  deployCommand: string;
  permissions: string[];
}

interface ServiceAccountConfig {
  username: string;
  projectName: string;
  homeDirectory: string;
  workspace: string;
  gitIdentity: {
    name: string;
    email: string;
  };
  awsProfile: string;
}

// Project Detection
class ProjectDetector {
  async detect(): Promise<ProjectType> {
    const cwd = Deno.cwd();
    const projectName = cwd.split('/').pop() || 'unknown';
    
    // Check for SAM
    try {
      await Deno.stat('template.yaml');
      return {
        type: 'SAM',
        name: projectName,
        configFile: 'template.yaml',
        deployCommand: 'sam deploy',
        permissions: ['lambda', 'apigateway', 'cloudformation', 's3', 'iam']
      };
    } catch {
      // Not SAM
    }
    
    // Check for CDK
    try {
      await Deno.stat('cdk.json');
      return {
        type: 'CDK',
        name: projectName,
        configFile: 'cdk.json',
        deployCommand: 'cdk deploy',
        permissions: ['cloudformation', 'cdk', 's3', 'iam', 'ec2', 'lambda']
      };
    } catch {
      // Not CDK
    }
    
    // Generic project
    return {
      type: 'GENERIC',
      name: projectName,
      deployCommand: 'aws cloudformation deploy',
      permissions: ['s3', 'lambda', 'cloudformation']
    };
  }
  
  async generateConfig(): Promise<ServiceAccountConfig> {
    const project = await this.detect();
    const username = `q-assistant-${project.name}`;
    
    return {
      username,
      projectName: project.name,
      homeDirectory: `/home/${username}`,
      workspace: `/home/${username}/workspace`,
      gitIdentity: {
        name: `Q Assistant (${project.name})`,
        email: `q-assistant+${project.name}@no-wing.dev`
      },
      awsProfile: username
    };
  }
}

// Service Account Manager
class ServiceAccountManager {
  constructor(private config: ServiceAccountConfig) {}
  
  async createUser(): Promise<void> {
    console.log(colors.cyan('Creating local user account...'));
    
    const cmd = new Deno.Command('useradd', {
      args: [
        '-m',
        '-s', '/bin/bash',
        '-c', `Q Assistant for ${this.config.projectName}`,
        this.config.username
      ]
    });
    
    const { code, stderr } = await cmd.output();
    
    if (code !== 0) {
      const error = new TextDecoder().decode(stderr);
      throw new Error(`Failed to create user: ${error}`);
    }
  }
  
  async setupHomeDirectory(): Promise<void> {
    console.log(colors.cyan('Setting up home directory...'));
    
    const dirs = [
      `${this.config.homeDirectory}/.aws`,
      `${this.config.homeDirectory}/.ssh`,
      `${this.config.homeDirectory}/.no-wing`,
      `${this.config.homeDirectory}/workspace`
    ];
    
    for (const dir of dirs) {
      await Deno.mkdir(dir, { recursive: true });
    }
    
    // Set ownership
    const chownCmd = new Deno.Command('chown', {
      args: ['-R', `${this.config.username}:${this.config.username}`, this.config.homeDirectory]
    });
    await chownCmd.output();
  }
  
  async configureGit(): Promise<void> {
    console.log(colors.cyan('Configuring git identity...'));
    
    const gitConfig = [
      '[user]',
      `    name = ${this.config.gitIdentity.name}`,
      `    email = ${this.config.gitIdentity.email}`,
      '[core]',
      '    editor = nano',
      '[init]',
      '    defaultBranch = main'
    ].join('\n');
    
    const gitConfigPath = `${this.config.homeDirectory}/.gitconfig`;
    await Deno.writeTextFile(gitConfigPath, gitConfig);
    
    // Set ownership
    const chownCmd = new Deno.Command('chown', {
      args: [`${this.config.username}:${this.config.username}`, gitConfigPath]
    });
    await chownCmd.output();
  }
  
  async userExists(): Promise<boolean> {
    const cmd = new Deno.Command('id', {
      args: [this.config.username]
    });
    
    const { code } = await cmd.output();
    return code === 0;
  }
  
  async removeUser(): Promise<void> {
    console.log(colors.cyan('Removing user account...'));
    
    const cmd = new Deno.Command('userdel', {
      args: ['-r', this.config.username]
    });
    
    await cmd.output();
  }
}

// Commands
async function setupCommand(options: { force?: boolean; skipAws?: boolean }) {
  console.log(colors.cyan('🛫 no-wing - Q Service Account Setup (Deno)'));
  console.log('');
  
  const detector = new ProjectDetector();
  const project = await detector.detect();
  const config = await detector.generateConfig();
  
  console.log(colors.green(`Detected ${project.type} project: ${project.name}`));
  console.log('');
  
  const manager = new ServiceAccountManager(config);
  
  // Check if user exists
  if (await manager.userExists() && !options.force) {
    console.log(colors.yellow('⚠️  Service account already exists'));
    console.log('Use --force to recreate');
    return;
  }
  
  if (options.force && await manager.userExists()) {
    await manager.removeUser();
  }
  
  // Create service account
  await manager.createUser();
  await manager.setupHomeDirectory();
  await manager.configureGit();
  
  console.log('');
  console.log(colors.green('✅ Setup Complete'));
  console.log(`  • User: ${config.username}`);
  console.log(`  • Git: ${config.gitIdentity.name}`);
  console.log(`  • Home: ${config.homeDirectory}`);
}

async function statusCommand() {
  console.log(colors.cyan('🛫 no-wing - Service Account Status (Deno)'));
  console.log('');
  
  const detector = new ProjectDetector();
  const config = await detector.generateConfig();
  const manager = new ServiceAccountManager(config);
  
  const exists = await manager.userExists();
  
  if (exists) {
    console.log(colors.green(`✅ Service account exists: ${config.username}`));
  } else {
    console.log(colors.red(`❌ Service account not found: ${config.username}`));
  }
}

async function cleanupCommand(options: { force?: boolean }) {
  console.log(colors.cyan('🛫 no-wing - Cleanup (Deno)'));
  console.log('');
  
  const detector = new ProjectDetector();
  const config = await detector.generateConfig();
  const manager = new ServiceAccountManager(config);
  
  if (!await manager.userExists()) {
    console.log(colors.yellow('No service account to clean up'));
    return;
  }
  
  if (!options.force) {
    const confirm = prompt(`Remove service account ${config.username}? (y/N)`);
    if (confirm?.toLowerCase() !== 'y') {
      console.log('Cancelled');
      return;
    }
  }
  
  await manager.removeUser();
  console.log(colors.green('✅ Service account removed'));
}

// Main CLI
async function main() {
  const args = parseArgs(Deno.args, {
    boolean: ['help', 'version', 'force', 'skip-aws'],
    string: ['_']
  });
  
  const command = args._[0] as string;
  
  if (args.help || !command) {
    console.log(colors.cyan('🛫 no-wing (Deno) - Q Service Account Manager'));
    console.log('');
    console.log('Commands:');
    console.log('  setup [--force] [--skip-aws]  Create Q service account');
    console.log('  status                        Show service account status');
    console.log('  cleanup [--force]             Remove service account');
    console.log('');
    console.log('Examples:');
    console.log('  deno run --allow-all main.ts setup');
    console.log('  sudo deno run --allow-all main.ts setup');
    return;
  }
  
  if (args.version) {
    console.log('no-wing-deno 0.1.0');
    return;
  }
  
  // Check sudo for commands that need it
  const needsSudoCommands = ['setup', 'cleanup'];
  if (needsSudoCommands.includes(command) && needsSudo()) {
    console.log(colors.yellow('⚠️  This command requires sudo privileges'));
    console.log(colors.gray('Run with sudo: sudo no-wing-deno ' + Deno.args.join(' ')));
    Deno.exit(1);
  }
  
  try {
    switch (command) {
      case 'setup':
        await setupCommand({ force: args.force, skipAws: args['skip-aws'] });
        break;
      case 'status':
        await statusCommand();
        break;
      case 'cleanup':
        await cleanupCommand({ force: args.force });
        break;
      default:
        console.log(colors.red(`Unknown command: ${command}`));
        Deno.exit(1);
    }
  } catch (error) {
    console.error(colors.red('❌ Error:'), error.message);
    Deno.exit(1);
  }
}

// Check if we need sudo for user operations
function needsSudo(): boolean {
  // Check if we're running as root via environment variables
  const user = Deno.env.get('USER') || Deno.env.get('USERNAME');
  const sudoUser = Deno.env.get('SUDO_USER');
  
  // If SUDO_USER is set, we're running with sudo
  if (sudoUser) {
    return false; // We already have sudo
  }
  
  // If user is root, we don't need sudo
  if (user === 'root') {
    return false;
  }
  
  // Otherwise, we probably need sudo
  return true;
}

if (import.meta.main) {
  await main();
}
