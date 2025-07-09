#!/usr/bin/env -S deno run --allow-all

/**
 * no-wing - Q Service Account Manager (Deno)
 * 
 * Complete Deno implementation with no Node.js dependencies
 * - No sudo required
 * - No build step
 * - Single binary execution
 * - Built-in TypeScript
 * - Cross-platform
 */

import { parseArgs } from "https://deno.land/std@0.208.0/cli/parse_args.ts";
import * as colors from "https://deno.land/std@0.208.0/fmt/colors.ts";
import { exists } from "https://deno.land/std@0.208.0/fs/exists.ts";
import { ensureDir } from "https://deno.land/std@0.208.0/fs/ensure_dir.ts";

// Types
interface ProjectType {
  type: 'SAM' | 'CDK' | 'GENERIC';
  name: string;
  configFile?: string;
  deployCommand: string;
  permissions: string[];
}

interface ServiceAccountConfig {
  projectName: string;
  username: string;
  workspaceDir: string;
  gitIdentity: {
    name: string;
    email: string;
  };
  awsProfile: string;
}

interface ServiceAccountStatus {
  exists: boolean;
  workspace: boolean;
  gitConfigured: boolean;
  awsConfigured: boolean;
  launchScripts: boolean;
}

// Project Detection
class ProjectDetector {
  async detect(): Promise<ProjectType> {
    const cwd = Deno.cwd();
    const projectName = cwd.split('/').pop() || cwd.split('\\').pop() || 'unknown';
    
    // Check for SAM
    if (await exists('template.yaml') || await exists('template.yml')) {
      return {
        type: 'SAM',
        name: projectName,
        configFile: 'template.yaml',
        deployCommand: 'sam deploy',
        permissions: ['lambda', 'apigateway', 'cloudformation', 's3', 'iam']
      };
    }
    
    // Check for CDK
    if (await exists('cdk.json')) {
      return {
        type: 'CDK',
        name: projectName,
        configFile: 'cdk.json',
        deployCommand: 'cdk deploy',
        permissions: ['cloudformation', 'cdk', 's3', 'iam', 'ec2', 'lambda']
      };
    }
    
    // Generic project
    return {
      type: 'GENERIC',
      name: projectName,
      deployCommand: 'aws cloudformation deploy',
      permissions: ['s3', 'lambda', 'cloudformation']
    };
  }
}

// Service Account Manager
class ServiceAccountManager {
  private config: ServiceAccountConfig;
  private baseDir: string;

  constructor(projectName: string) {
    const homeDir = Deno.env.get('HOME') || Deno.env.get('USERPROFILE') || '.';
    this.baseDir = `${homeDir}/.no-wing/service-accounts`;
    
    this.config = {
      projectName,
      username: `q-assistant-${projectName}`,
      workspaceDir: `${this.baseDir}/${projectName}`,
      gitIdentity: {
        name: `Q Assistant (${projectName})`,
        email: `q-assistant+${projectName}@no-wing.dev`
      },
      awsProfile: `q-assistant-${projectName}`
    };
  }

  async create(force: boolean = false): Promise<void> {
    if (!force && await this.exists()) {
      throw new Error(`Service account for ${this.config.projectName} already exists`);
    }

    // Create workspace structure
    await this.createWorkspaceStructure();
    
    // Set up git identity
    await this.setupGitIdentity();
    
    // Create AWS profile
    await this.setupAWSProfile();
    
    // Create launch scripts
    await this.createLaunchScripts();
  }

  async exists(): Promise<boolean> {
    return await exists(this.config.workspaceDir);
  }

  async remove(): Promise<void> {
    if (await this.exists()) {
      await Deno.remove(this.config.workspaceDir, { recursive: true });
    }
  }

  async getStatus(): Promise<ServiceAccountStatus> {
    const serviceExists = await this.exists();
    
    if (!serviceExists) {
      return {
        exists: false,
        workspace: false,
        gitConfigured: false,
        awsConfigured: false,
        launchScripts: false
      };
    }

    const workspace = await exists(`${this.config.workspaceDir}/workspace`);
    const gitConfigured = await exists(`${this.config.workspaceDir}/.gitconfig`);
    const awsConfigured = await exists(`${this.config.workspaceDir}/.aws/config`);
    const launchScripts = await exists(`${this.config.workspaceDir}/bin/launch-q`);

    return {
      exists: serviceExists,
      workspace,
      gitConfigured,
      awsConfigured,
      launchScripts
    };
  }

  async launchQ(args: string[] = ['chat']): Promise<void> {
    const launchScript = `${this.config.workspaceDir}/bin/launch-q`;
    
    if (!await exists(launchScript)) {
      throw new Error('Service account not properly configured. Run setup first.');
    }

    // Set up environment
    const env = {
      ...Object.fromEntries(Deno.env.entries()),
      GIT_CONFIG_GLOBAL: `${this.config.workspaceDir}/.gitconfig`,
      AWS_CONFIG_FILE: `${this.config.workspaceDir}/.aws/config`,
      AWS_SHARED_CREDENTIALS_FILE: `${this.config.workspaceDir}/.aws/credentials`,
      AWS_PROFILE: this.config.awsProfile,
      NO_WING_SERVICE_ACCOUNT: this.config.username,
      NO_WING_PROJECT: this.config.projectName
    };

    // Execute launch script
    const cmd = new Deno.Command('bash', {
      args: [launchScript, ...args],
      env,
      cwd: `${this.config.workspaceDir}/workspace`,
      stdin: 'inherit',
      stdout: 'inherit',
      stderr: 'inherit'
    });

    const { code } = await cmd.output();
    
    if (code !== 0) {
      throw new Error(`Q CLI exited with code ${code}`);
    }
  }

  getConfig(): ServiceAccountConfig {
    return { ...this.config };
  }

  // Private methods
  private async createWorkspaceStructure(): Promise<void> {
    const dirs = [
      this.config.workspaceDir,
      `${this.config.workspaceDir}/.aws`,
      `${this.config.workspaceDir}/.ssh`,
      `${this.config.workspaceDir}/workspace`,
      `${this.config.workspaceDir}/logs`,
      `${this.config.workspaceDir}/bin`
    ];

    for (const dir of dirs) {
      await ensureDir(dir);
    }
  }

  private async setupGitIdentity(): Promise<void> {
    const gitConfig = [
      '[user]',
      `    name = ${this.config.gitIdentity.name}`,
      `    email = ${this.config.gitIdentity.email}`,
      '[core]',
      '    editor = nano',
      '[init]',
      '    defaultBranch = main',
      '[credential]',
      '    helper = store'
    ].join('\n');

    await Deno.writeTextFile(`${this.config.workspaceDir}/.gitconfig`, gitConfig);
  }

  private async setupAWSProfile(): Promise<void> {
    // Create AWS config
    const awsConfig = [
      `[profile ${this.config.awsProfile}]`,
      'region = us-east-1',
      'output = json'
    ].join('\n');

    await Deno.writeTextFile(`${this.config.workspaceDir}/.aws/config`, awsConfig);

    // Create placeholder credentials file
    const credentialsFile = [
      `[${this.config.awsProfile}]`,
      '# AWS credentials will be configured here',
      '# Run: no-wing aws-setup to configure'
    ].join('\n');

    await Deno.writeTextFile(`${this.config.workspaceDir}/.aws/credentials`, credentialsFile);
  }

  private async createLaunchScripts(): Promise<void> {
    // Create Q launch script
    const launchScript = [
      '#!/bin/bash',
      '# Q Assistant Launch Script (Deno)',
      `# Project: ${this.config.projectName}`,
      `# Identity: ${this.config.gitIdentity.name}`,
      '',
      'set -e',
      '',
      '# Log the session',
      `echo "$(date): Q session started with args: $*" >> "${this.config.workspaceDir}/logs/sessions.log"`,
      '',
      '# Check if Q CLI is available',
      'if ! command -v q &> /dev/null; then',
      '    echo "❌ Amazon Q CLI not found"',
      '    echo "Please install Q CLI first"',
      '    echo ""',
      '    echo "Installation guide:"',
      '    echo "https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/cli-install.html"',
      '    exit 1',
      'fi',
      '',
      '# Launch Q with service account identity',
      'echo "🛫 Launching Q as service account..."',
      `echo "Identity: ${this.config.gitIdentity.name}"`,
      `echo "AWS Profile: ${this.config.awsProfile}"`,
      'echo ""',
      '',
      '# Execute Q CLI',
      'exec q "$@"'
    ].join('\n');

    await Deno.writeTextFile(`${this.config.workspaceDir}/bin/launch-q`, launchScript);
    
    // Make executable (Unix-like systems)
    if (Deno.build.os !== 'windows') {
      await Deno.chmod(`${this.config.workspaceDir}/bin/launch-q`, 0o755);
    }

    // Create status script
    const statusScript = [
      '#!/bin/bash',
      '# Service Account Status Script (Deno)',
      '',
      `echo "🛫 Service Account Status: ${this.config.projectName}"`,
      'echo ""',
      `echo "Workspace: ${this.config.workspaceDir}"`,
      `echo "Git Identity: ${this.config.gitIdentity.name}"`,
      `echo "AWS Profile: ${this.config.awsProfile}"`,
      'echo ""',
      '',
      '# Show recent sessions',
      `if [ -f "${this.config.workspaceDir}/logs/sessions.log" ]; then`,
      '    echo "Recent Q sessions:"',
      `    tail -5 "${this.config.workspaceDir}/logs/sessions.log"`,
      'fi'
    ].join('\n');

    await Deno.writeTextFile(`${this.config.workspaceDir}/bin/status`, statusScript);
    
    if (Deno.build.os !== 'windows') {
      await Deno.chmod(`${this.config.workspaceDir}/bin/status`, 0o755);
    }
  }
}

// Commands
async function setupCommand(options: { force?: boolean; skipAws?: boolean }) {
  console.log(colors.cyan('🛫 no-wing - Q Service Account Setup (Deno)'));
  console.log('');
  
  const detector = new ProjectDetector();
  const project = await detector.detect();
  const manager = new ServiceAccountManager(project.name);
  
  console.log(colors.green(`✅ Detected ${project.type} project: ${project.name}`));
  if (project.configFile) {
    console.log(colors.gray(`   Config: ${project.configFile}`));
  }
  console.log(colors.gray(`   Deploy: ${project.deployCommand}`));
  console.log('');
  
  // Check if exists
  if (await manager.exists() && !options.force) {
    console.log(colors.yellow('⚠️  Service account already exists'));
    console.log('Use --force to recreate');
    return;
  }
  
  if (options.force && await manager.exists()) {
    console.log(colors.cyan('🧹 Removing existing service account...'));
    await manager.remove();
  }
  
  // Create service account
  console.log(colors.cyan('📦 Creating service account workspace...'));
  await manager.create(options.force);
  
  const config = manager.getConfig();
  
  console.log('');
  console.log(colors.green('✅ Setup Complete'));
  console.log('');
  console.log(colors.yellow('📋 What was created:'));
  console.log(`  • Workspace: ${colors.gray(config.workspaceDir)}`);
  console.log(`  • Git Identity: ${colors.green(config.gitIdentity.name)}`);
  console.log(`  • AWS Profile: ${colors.green(config.awsProfile)}`);
  console.log(`  • Launch Scripts: ${colors.gray('Ready')}`);
  console.log('');
  console.log(colors.cyan('🚀 Next steps:'));
  console.log('  no-wing status       # Check service account');
  console.log('  no-wing launch       # Launch Q with service account');
  console.log('  no-wing aws-setup    # Configure AWS credentials');
}

async function statusCommand() {
  console.log(colors.cyan('🛫 no-wing - Service Account Status'));
  console.log('');
  
  const detector = new ProjectDetector();
  const project = await detector.detect();
  const manager = new ServiceAccountManager(project.name);
  
  console.log(colors.yellow('📋 Project Information'));
  console.log(`  Type: ${project.type}`);
  console.log(`  Name: ${project.name}`);
  if (project.configFile) {
    console.log(`  Config: ${project.configFile}`);
  }
  console.log(`  Deploy: ${project.deployCommand}`);
  console.log('');

  const status = await manager.getStatus();
  const config = manager.getConfig();

  if (!status.exists) {
    console.log(colors.red('❌ Service account not found'));
    console.log('');
    console.log(colors.cyan('Run: no-wing setup'));
    return;
  }

  console.log(colors.yellow('🔐 Service Account Status'));
  console.log('');
  console.log(`${status.workspace ? '✅' : '❌'} Workspace: ${config.workspaceDir}`);
  console.log(`${status.gitConfigured ? '✅' : '❌'} Git Identity: ${config.gitIdentity.name}`);
  console.log(`${status.awsConfigured ? '✅' : '❌'} AWS Profile: ${config.awsProfile}`);
  console.log(`${status.launchScripts ? '✅' : '❌'} Launch Scripts: Ready`);
  
  console.log('');
  
  if (status.workspace && status.gitConfigured && status.launchScripts) {
    console.log(colors.green('✅ Service account is ready!'));
    console.log('');
    console.log(colors.cyan('🚀 Available commands:'));
    console.log('  no-wing launch           # Launch Q chat');
    console.log('  no-wing launch help      # Q CLI help');
    console.log('  no-wing aws-setup        # Configure AWS');
  } else {
    console.log(colors.yellow('⚠️  Service account needs setup'));
    console.log('');
    console.log(colors.cyan('Run: no-wing setup --force'));
  }
}

async function launchCommand(args: string[]) {
  console.log(colors.cyan('🛫 no-wing - Launch Q'));
  console.log('');

  const detector = new ProjectDetector();
  const project = await detector.detect();
  const manager = new ServiceAccountManager(project.name);
  
  if (!await manager.exists()) {
    console.log(colors.red('❌ Service account not found'));
    console.log('Run: no-wing setup');
    return;
  }

  const config = manager.getConfig();
  console.log(colors.green(`Launching Q as: ${config.gitIdentity.name}`));
  console.log(colors.gray(`AWS Profile: ${config.awsProfile}`));
  console.log('');

  // Launch Q
  await manager.launchQ(args.length > 0 ? args : ['chat']);
}

async function awsSetupCommand() {
  console.log(colors.cyan('🛫 no-wing - AWS Setup'));
  console.log('');

  const detector = new ProjectDetector();
  const project = await detector.detect();
  const manager = new ServiceAccountManager(project.name);
  
  if (!await manager.exists()) {
    console.log(colors.red('❌ Service account not found'));
    console.log('Run: no-wing setup');
    return;
  }

  const config = manager.getConfig();
  
  console.log(colors.yellow('AWS Credential Setup'));
  console.log(`Profile: ${config.awsProfile}`);
  console.log('');

  // Simple prompt for credentials
  const accessKeyId = prompt('AWS Access Key ID:');
  if (!accessKeyId) {
    console.log(colors.red('❌ Access Key ID is required'));
    return;
  }

  const secretAccessKey = prompt('AWS Secret Access Key:');
  if (!secretAccessKey) {
    console.log(colors.red('❌ Secret Access Key is required'));
    return;
  }

  // Write credentials
  const credentials = [
    `[${config.awsProfile}]`,
    `aws_access_key_id = ${accessKeyId}`,
    `aws_secret_access_key = ${secretAccessKey}`
  ].join('\n');

  await Deno.writeTextFile(`${config.workspaceDir}/.aws/credentials`, credentials);

  console.log('');
  console.log(colors.green('✅ AWS credentials configured'));
  console.log(`Profile: ${config.awsProfile}`);
}

async function cleanupCommand(options: { force?: boolean }) {
  console.log(colors.cyan('🛫 no-wing - Cleanup'));
  console.log('');

  const detector = new ProjectDetector();
  const project = await detector.detect();
  const manager = new ServiceAccountManager(project.name);
  
  if (!await manager.exists()) {
    console.log(colors.yellow('No service account to clean up'));
    return;
  }

  const config = manager.getConfig();

  if (!options.force) {
    const confirm = prompt(`Remove service account for ${project.name}? (y/N)`);
    if (confirm?.toLowerCase() !== 'y') {
      console.log('Cancelled');
      return;
    }
  }

  await manager.remove();
  
  console.log(colors.green('✅ Service account removed'));
  console.log(`Workspace: ${config.workspaceDir}`);
}

// Main CLI
async function main() {
  const args = parseArgs(Deno.args, {
    boolean: ['help', 'version', 'force', 'skip-aws'],
    string: ['_']
  });
  
  const command = args._[0] as string;
  const commandArgs = args._.slice(1) as string[];
  
  if (args.help || !command) {
    console.log(colors.cyan('🛫 no-wing - Q Service Account Manager'));
    console.log('');
    console.log(colors.yellow('Give Amazon Q its own identity - no sudo required!'));
    console.log('');
    console.log('Commands:');
    console.log('  setup [--force]              Create Q service account');
    console.log('  status                       Show service account status');
    console.log('  launch [q-cli-args...]       Launch Q with service account');
    console.log('  aws-setup                    Configure AWS credentials');
    console.log('  cleanup [--force]            Remove service account');
    console.log('');
    console.log('Examples:');
    console.log('  no-wing setup                # Create service account');
    console.log('  no-wing launch               # Launch Q chat');
    console.log('  no-wing launch help          # Show Q CLI help');
    console.log('  no-wing launch --verbose     # Launch Q with verbose output');
    console.log('');
    console.log(colors.green('✨ Benefits:'));
    console.log('  ✅ No sudo required');
    console.log('  ✅ Isolated per project');
    console.log('  ✅ Separate git identity');
    console.log('  ✅ Dedicated AWS profile');
    console.log('  ✅ Complete audit trail');
    return;
  }
  
  if (args.version) {
    console.log('no-wing 1.0.0 (Deno)');
    return;
  }
  
  try {
    switch (command) {
      case 'setup':
        await setupCommand({ force: args.force, skipAws: args['skip-aws'] });
        break;
      case 'status':
        await statusCommand();
        break;
      case 'launch':
        await launchCommand(commandArgs);
        break;
      case 'aws-setup':
        await awsSetupCommand();
        break;
      case 'cleanup':
        await cleanupCommand({ force: args.force });
        break;
      default:
        console.log(colors.red(`Unknown command: ${command}`));
        console.log('Run "no-wing --help" for available commands');
        Deno.exit(1);
    }
  } catch (error) {
    console.error(colors.red('❌ Error:'), error.message);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await main();
}
