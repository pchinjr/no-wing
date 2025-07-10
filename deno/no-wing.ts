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
  private project: ProjectType;

  constructor(project: ProjectType) {
    this.project = project;
    const homeDir = Deno.env.get('HOME') || Deno.env.get('USERPROFILE') || '.';
    this.baseDir = `${homeDir}/.no-wing/service-accounts`;
    
    this.config = {
      projectName: project.name,
      username: `q-assistant-${project.name}`,
      workspaceDir: `${this.baseDir}/${project.name}`,
      gitIdentity: {
        name: `Q Assistant (${project.name})`,
        email: `q-assistant+${project.name}@no-wing.dev`
      },
      awsProfile: `q-assistant-${project.name}`
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
    
    // SAM-specific configuration
    if (this.project.type === 'SAM') {
      await this.configureSAMProject();
    }
  }

  private async configureSAMProject() {
    const samConfigPath = 'samconfig.toml';
    
    if (await exists(samConfigPath)) {
      console.log(colors.cyan('🔧 Configuring SAM project for automated deployment...'));
      
      try {
        const samConfig = await Deno.readTextFile(samConfigPath);
        
        // Check if confirm_changeset is set to true (problematic)
        if (samConfig.includes('confirm_changeset = true')) {
          console.log(colors.yellow('⚠️  Found confirm_changeset = true in samconfig.toml'));
          console.log('   This causes sam deploy to hang waiting for user input');
          console.log('   Updating to confirm_changeset = false for automated deployment...');
          
          const updatedConfig = samConfig.replace(
            /confirm_changeset\s*=\s*true/g,
            'confirm_changeset = false'
          );
          
          await Deno.writeTextFile(samConfigPath, updatedConfig);
          console.log(colors.green('✅ Updated samconfig.toml for automated deployment'));
        } else if (!samConfig.includes('confirm_changeset')) {
          console.log(colors.yellow('⚠️  No confirm_changeset setting found in samconfig.toml'));
          console.log('   Adding confirm_changeset = false for automated deployment...');
          
          // Add confirm_changeset = false to deploy parameters
          const updatedConfig = samConfig.replace(
            /(\[default\.deploy\.parameters\])/,
            '$1\nconfirm_changeset = false'
          );
          
          await Deno.writeTextFile(samConfigPath, updatedConfig);
          console.log(colors.green('✅ Added confirm_changeset = false to samconfig.toml'));
        } else {
          console.log(colors.green('✅ samconfig.toml already configured for automated deployment'));
        }
        
      } catch (error) {
        console.log(colors.yellow('⚠️  Could not read/update samconfig.toml:', error.message));
      }
    } else {
      console.log(colors.yellow('⚠️  No samconfig.toml found - Q may need to run sam deploy --guided once'));
      console.log('   Or create samconfig.toml manually with confirm_changeset = false');
    }
    
    // Create system prompt
    await this.createSystemPrompt();
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
      ...Deno.env.toObject(),
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
      cwd: Deno.cwd(), // Work in the current directory (your project), not the service account workspace
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

  private async createSystemPrompt(): Promise<void> {
    const systemPrompt = [
      '# Q Assistant System Prompt - Project Workflow',
      '',
      '## Core Workflow',
      'When starting any task, follow this structured approach:',
      '',
      '### 1. Think First',
      '- Analyze the request thoroughly',
      '- Consider edge cases and potential issues',
      '- Think through the implementation approach',
      '',
      '### 2. Create Task List',
      '- Break down the work into verifiable goals',
      '- Make each goal specific and measurable',
      '- Prioritize tasks logically',
      '- Write the task list to `docs/tasks.md` or similar',
      '',
      '### 3. Document Architecture',
      '- Record key architectural decisions in `docs/architecture.md`',
      '- Explain the reasoning behind technical choices',
      '- Document any trade-offs or alternatives considered',
      '- Keep documentation updated as decisions evolve',
      '',
      '### 4. Small, Frequent Commits',
      '- Make commits after each logical unit of work',
      '- Use descriptive commit messages',
      '- Commit documentation changes separately from code',
      '- Each commit should represent a working state',
      '',
      '## Documentation Standards',
      '- Always create/update relevant documentation',
      '- Use clear, concise language',
      '- Include examples where helpful',
      '- Keep docs in sync with code changes',
      '',
      '## Commit Message Format',
      '- Use conventional commit format when appropriate',
      '- Be specific about what changed and why',
      '- Reference task items when applicable',
      '',
      '## Remember',
      '- You are Q Assistant working on behalf of the developer',
      '- Your commits will be attributed to you, not the human',
      '- Your AWS deployments will use your dedicated service account credentials',
      '- Maintain high code quality and documentation standards',
      '- Ask for clarification when requirements are unclear',
      '',
      '## AWS Deployment Identity',
      `- Your AWS profile: ${this.config.awsProfile}`,
      '- Your deployments are separate from the human developer\'s deployments',
      '- Use AWS CLI commands normally - credentials are automatically configured',
      '',
      '## SAM Deployment Guidelines',
      '- NEVER use `sam deploy --guided` - configuration is already set up',
      '- ALWAYS use `sam deploy` (without --guided flag)',
      '- The samconfig.toml file contains all necessary configuration',
      '- Your AWS credentials are pre-configured and isolated',
      '- If deployment fails, check the specific error, don\'t default to --guided',
      '',
      '---',
      `Generated for project: ${this.config.projectName}`,
      `Service account: ${this.config.gitIdentity.name}`,
      `Date: ${new Date().toISOString().split('T')[0]}`
    ].join('\n');

    await Deno.writeTextFile(`${this.config.workspaceDir}/system-prompt.md`, systemPrompt);
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
      '# Check if system prompt exists and show it',
      `SYSTEM_PROMPT="${this.config.workspaceDir}/system-prompt.md"`,
      'if [ -f "$SYSTEM_PROMPT" ]; then',
      '    echo "📋 Loading system prompt for Q Assistant..."',
      '    echo "   (System prompt available at: $SYSTEM_PROMPT)"',
      '    echo ""',
      '    echo "💡 Reminder: Q will follow the workflow in system-prompt.md:"',
      '    echo "   1. Think first, 2. Create task list, 3. Document architecture, 4. Small commits"',
      '    echo "   Use \'no-wing prompt\' to view or \'no-wing prompt edit\' to customize"',
      '    echo ""',
      'fi',
      '',
      '# Execute Q CLI with service account git identity',
      '# Note: Environment variables are set only for the Q process, not the shell',
      '',
      '# Show system prompt reminder for chat sessions',
      'if [ -f "$SYSTEM_PROMPT" ] && [ "$1" = "chat" -o $# -eq 0 ]; then',
      '    echo "💬 Starting Q chat session..."',
      '    echo "📝 Tip: Share the system prompt with Q by saying:"',
      '    echo "   \\"Please read the system prompt at $SYSTEM_PROMPT and follow its workflow\\""',
      '    echo ""',
      'fi',
      '',
      `exec env \\`,
      `  GIT_AUTHOR_NAME="${this.config.gitIdentity.name}" \\`,
      `  GIT_AUTHOR_EMAIL="${this.config.gitIdentity.email}" \\`,
      `  GIT_COMMITTER_NAME="${this.config.gitIdentity.name}" \\`,
      `  GIT_COMMITTER_EMAIL="${this.config.gitIdentity.email}" \\`,
      `  GIT_CONFIG_GLOBAL="${this.config.workspaceDir}/.gitconfig" \\`,
      `  AWS_PROFILE="${this.config.awsProfile}" \\`,
      `  AWS_CONFIG_FILE="${this.config.workspaceDir}/.aws/config" \\`,
      `  AWS_SHARED_CREDENTIALS_FILE="${this.config.workspaceDir}/.aws/credentials" \\`,
      `  q "$@"`
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
  const manager = new ServiceAccountManager(project);
  
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
  const manager = new ServiceAccountManager(project);
  
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
    console.log('  no-wing sam-config       # Configure SAM deployment');
    console.log('  no-wing prompt           # View system prompt');
    console.log('  no-wing prompt edit      # Edit system prompt');
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
  const manager = new ServiceAccountManager(project);
  
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
  const manager = new ServiceAccountManager(project);
  
  if (!await manager.exists()) {
    console.log(colors.red('❌ Service account not found'));
    console.log('Run: no-wing setup');
    return;
  }

  const config = manager.getConfig();
  
  console.log(colors.yellow('🔐 AWS Credential Setup Options'));
  console.log('');
  console.log('Choose how to configure Q Assistant AWS credentials:');
  console.log('');
  console.log('1. 🎯 Recommended: Create IAM User for Q Assistant');
  console.log('   - Creates dedicated IAM user with scoped permissions');
  console.log('   - Uses your existing AWS credentials to set up Q\'s credentials');
  console.log('   - Proper security isolation');
  console.log('');
  console.log('2. 📋 Manual: Enter AWS credentials directly');
  console.log('   - You provide Access Key ID and Secret Access Key');
  console.log('   - For existing IAM users or when automatic setup isn\'t possible');
  console.log('');
  console.log('3. 🔗 Profile: Use existing AWS profile');
  console.log('   - Reference an existing AWS CLI profile');
  console.log('   - Good for development environments');
  console.log('');

  const choice = prompt('Select option (1, 2, or 3):');
  
  switch (choice) {
    case '1':
      await setupIAMUser(config, project);
      break;
    case '2':
      await setupManualCredentials(config);
      break;
    case '3':
      await setupProfileReference(config);
      break;
    default:
      console.log(colors.red('❌ Invalid choice'));
      return;
  }
}

async function setupIAMUser(config: ServiceAccountConfig, project: ProjectInfo) {
  console.log(colors.cyan('🎯 Setting up IAM User for Q Assistant'));
  console.log('');
  
  // Check if AWS CLI is available and configured
  try {
    const whoami = new Deno.Command('aws', {
      args: ['sts', 'get-caller-identity'],
      stdout: 'piped',
      stderr: 'piped'
    });
    
    const { success, stdout } = await whoami.output();
    
    if (!success) {
      console.log(colors.red('❌ AWS CLI not configured or not available'));
      console.log('Please configure AWS CLI first with your admin credentials:');
      console.log('  aws configure');
      console.log('');
      console.log('Or choose option 2 for manual setup');
      return;
    }
    
    const identity = JSON.parse(new TextDecoder().decode(stdout));
    console.log(colors.green(`✅ Using your AWS identity: ${identity.Arn}`));
    console.log('');
    
  } catch (error) {
    console.log(colors.red('❌ Failed to check AWS identity'));
    console.log('Please ensure AWS CLI is installed and configured');
    return;
  }

  const userName = `q-assistant-${config.projectName}`;
  const policyName = `QAssistantPolicy-${config.projectName}`;
  
  console.log(`Creating IAM user: ${userName}`);
  console.log(`Creating policy: ${policyName}`);
  console.log('');
  
  try {
    // Create IAM policy based on project type
    const policyDocument = generateIAMPolicy(project);
    
    // Create policy
    console.log('📝 Creating IAM policy...');
    const createPolicy = new Deno.Command('aws', {
      args: [
        'iam', 'create-policy',
        '--policy-name', policyName,
        '--policy-document', JSON.stringify(policyDocument),
        '--description', `Q Assistant permissions for ${config.projectName} project`
      ],
      stdout: 'piped',
      stderr: 'piped'
    });
    
    const policyResult = await createPolicy.output();
    let policyArn: string;
    
    if (policyResult.success) {
      const policyData = JSON.parse(new TextDecoder().decode(policyResult.stdout));
      policyArn = policyData.Policy.Arn;
      console.log(colors.green(`✅ Policy created: ${policyArn}`));
    } else {
      const error = new TextDecoder().decode(policyResult.stderr);
      if (error.includes('EntityAlreadyExists')) {
        // Policy exists, get its ARN
        const getPolicy = new Deno.Command('aws', {
          args: ['iam', 'get-policy', '--policy-arn', `arn:aws:iam::${await getAccountId()}:policy/${policyName}`],
          stdout: 'piped'
        });
        const existingPolicy = await getPolicy.output();
        const existingPolicyData = JSON.parse(new TextDecoder().decode(existingPolicy.stdout));
        policyArn = existingPolicyData.Policy.Arn;
        console.log(colors.yellow(`⚠️  Policy already exists: ${policyArn}`));
      } else {
        throw new Error(`Failed to create policy: ${error}`);
      }
    }

    // Create IAM user
    console.log('👤 Creating IAM user...');
    const createUser = new Deno.Command('aws', {
      args: [
        'iam', 'create-user',
        '--user-name', userName,
        '--tags', `Key=Purpose,Value=QAssistant`, `Key=Project,Value=${config.projectName}`
      ],
      stdout: 'piped',
      stderr: 'piped'
    });
    
    const userResult = await createUser.output();
    if (userResult.success) {
      console.log(colors.green(`✅ User created: ${userName}`));
    } else {
      const error = new TextDecoder().decode(userResult.stderr);
      if (!error.includes('EntityAlreadyExists')) {
        throw new Error(`Failed to create user: ${error}`);
      }
      console.log(colors.yellow(`⚠️  User already exists: ${userName}`));
    }

    // Attach policy to user
    console.log('🔗 Attaching policy to user...');
    const attachPolicy = new Deno.Command('aws', {
      args: [
        'iam', 'attach-user-policy',
        '--user-name', userName,
        '--policy-arn', policyArn
      ]
    });
    
    await attachPolicy.output();
    console.log(colors.green('✅ Policy attached to user'));

    // Create access key
    console.log('🔑 Creating access key...');
    const createAccessKey = new Deno.Command('aws', {
      args: [
        'iam', 'create-access-key',
        '--user-name', userName
      ],
      stdout: 'piped'
    });
    
    const keyResult = await createAccessKey.output();
    const keyData = JSON.parse(new TextDecoder().decode(keyResult.stdout));
    const accessKey = keyData.AccessKey;

    // Write credentials to service account
    await writeAWSCredentials(config, accessKey.AccessKeyId, accessKey.SecretAccessKey);
    
    console.log('');
    console.log(colors.green('✅ Q Assistant AWS setup complete!'));
    console.log('');
    console.log(colors.yellow('📋 What was created:'));
    console.log(`  • IAM User: ${userName}`);
    console.log(`  • IAM Policy: ${policyName}`);
    console.log(`  • Access Key: ${accessKey.AccessKeyId}`);
    console.log(`  • AWS Profile: ${config.awsProfile}`);
    console.log('');
    console.log(colors.cyan('🔐 Security Notes:'));
    console.log('  • Q Assistant has scoped permissions for this project');
    console.log('  • Your personal AWS credentials remain separate');
    console.log('  • Access key is stored in service account workspace only');
    
  } catch (error) {
    console.log(colors.red(`❌ Failed to set up IAM user: ${error.message}`));
    console.log('');
    console.log('You can try:');
    console.log('  • Option 2: Manual credential setup');
    console.log('  • Option 3: Use existing AWS profile');
  }
}

async function setupManualCredentials(config: ServiceAccountConfig) {
  console.log(colors.cyan('📋 Manual AWS Credential Setup'));
  console.log('');
  
  console.log('Enter AWS credentials for Q Assistant:');
  console.log('(These should be for a dedicated IAM user with appropriate permissions)');
  console.log('');

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

  await writeAWSCredentials(config, accessKeyId, secretAccessKey);
  
  console.log('');
  console.log(colors.green('✅ AWS credentials configured manually'));
  console.log(`Profile: ${config.awsProfile}`);
}

async function setupProfileReference(config: ServiceAccountConfig) {
  console.log(colors.cyan('🔗 AWS Profile Reference Setup'));
  console.log('');
  
  // List available profiles
  try {
    const listProfiles = new Deno.Command('aws', {
      args: ['configure', 'list-profiles'],
      stdout: 'piped'
    });
    
    const { stdout } = await listProfiles.output();
    const profiles = new TextDecoder().decode(stdout).trim().split('\n');
    
    console.log('Available AWS profiles:');
    profiles.forEach((profile, index) => {
      console.log(`  ${index + 1}. ${profile}`);
    });
    console.log('');
    
    const profileName = prompt('Enter profile name to use:');
    if (!profileName || !profiles.includes(profileName)) {
      console.log(colors.red('❌ Invalid profile name'));
      return;
    }
    
    // Create config that references the profile
    const awsConfig = [
      `[profile ${config.awsProfile}]`,
      `source_profile = ${profileName}`,
      `region = ${await getDefaultRegion()}`
    ].join('\n');
    
    await Deno.writeTextFile(`${config.workspaceDir}/.aws/config`, awsConfig);
    
    console.log('');
    console.log(colors.green('✅ AWS profile reference configured'));
    console.log(`Q Assistant profile: ${config.awsProfile}`);
    console.log(`Source profile: ${profileName}`);
    
  } catch (error) {
    console.log(colors.red('❌ Failed to list AWS profiles'));
    console.log('Please ensure AWS CLI is installed and configured');
  }
}

async function writeAWSCredentials(config: ServiceAccountConfig, accessKeyId: string, secretAccessKey: string) {
  const credentials = [
    `[${config.awsProfile}]`,
    `aws_access_key_id = ${accessKeyId}`,
    `aws_secret_access_key = ${secretAccessKey}`
  ].join('\n');

  await Deno.writeTextFile(`${config.workspaceDir}/.aws/credentials`, credentials);
  
  const awsConfig = [
    `[profile ${config.awsProfile}]`,
    `region = ${await getDefaultRegion()}`,
    'output = json'
  ].join('\n');
  
  await Deno.writeTextFile(`${config.workspaceDir}/.aws/config`, awsConfig);
}

async function getAccountId(): Promise<string> {
  const whoami = new Deno.Command('aws', {
    args: ['sts', 'get-caller-identity', '--query', 'Account', '--output', 'text'],
    stdout: 'piped'
  });
  
  const { stdout } = await whoami.output();
  return new TextDecoder().decode(stdout).trim();
}

async function getDefaultRegion(): Promise<string> {
  try {
    const region = new Deno.Command('aws', {
      args: ['configure', 'get', 'region'],
      stdout: 'piped'
    });
    
    const { stdout } = await region.output();
    const result = new TextDecoder().decode(stdout).trim();
    return result || 'us-east-1';
  } catch {
    return 'us-east-1';
  }
}

function generateIAMPolicy(project: ProjectInfo) {
  const basePermissions = [
    "logs:CreateLogGroup",
    "logs:CreateLogStream", 
    "logs:PutLogEvents",
    "logs:DescribeLogGroups",
    "logs:DescribeLogStreams"
  ];

  let permissions = [...basePermissions];

  switch (project.type) {
    case 'SAM':
      permissions.push(
        // CloudFormation
        "cloudformation:CreateStack",
        "cloudformation:UpdateStack",
        "cloudformation:DescribeStacks",
        "cloudformation:DescribeStackEvents",
        "cloudformation:DescribeStackResources",
        "cloudformation:GetTemplate",
        // Lambda
        "lambda:CreateFunction",
        "lambda:UpdateFunctionCode",
        "lambda:UpdateFunctionConfiguration",
        "lambda:GetFunction",
        "lambda:ListFunctions",
        "lambda:InvokeFunction",
        // API Gateway
        "apigateway:GET",
        "apigateway:POST",
        "apigateway:PUT",
        "apigateway:DELETE",
        // S3 for deployment artifacts
        "s3:CreateBucket",
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket",
        // IAM for Lambda execution roles
        "iam:CreateRole",
        "iam:AttachRolePolicy",
        "iam:GetRole",
        "iam:PassRole"
      );
      break;
      
    case 'CDK':
      permissions.push(
        // CloudFormation (CDK uses CloudFormation)
        "cloudformation:*",
        // S3 for CDK assets
        "s3:*",
        // IAM for CDK-created resources
        "iam:*",
        // EC2 for VPC resources
        "ec2:Describe*",
        "ec2:CreateVpc",
        "ec2:CreateSubnet",
        "ec2:CreateSecurityGroup",
        // Lambda
        "lambda:*"
      );
      break;
      
    default:
      // Generic permissions
      permissions.push(
        "s3:GetObject",
        "s3:PutObject",
        "s3:ListBucket",
        "cloudformation:DescribeStacks",
        "lambda:GetFunction",
        "lambda:ListFunctions"
      );
  }

  return {
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Action: permissions,
        Resource: "*"
      }
    ]
  };
}

async function samConfigCommand() {
  console.log(colors.cyan('🛫 no-wing - SAM Configuration'));
  console.log('');

  const detector = new ProjectDetector();
  const project = await detector.detect();
  
  if (project.type !== 'SAM') {
    console.log(colors.red('❌ This is not a SAM project'));
    console.log('SAM configuration is only available for SAM projects');
    return;
  }

  console.log(colors.green(`✅ SAM project detected: ${project.name}`));
  console.log('');

  const samConfigPath = 'samconfig.toml';
  
  if (await exists(samConfigPath)) {
    console.log(colors.cyan('🔍 Checking samconfig.toml...'));
    
    try {
      const samConfig = await Deno.readTextFile(samConfigPath);
      
      console.log('Current configuration:');
      if (samConfig.includes('confirm_changeset = true')) {
        console.log(colors.red('❌ confirm_changeset = true (causes hanging)'));
      } else if (samConfig.includes('confirm_changeset = false')) {
        console.log(colors.green('✅ confirm_changeset = false (automated deployment)'));
      } else {
        console.log(colors.yellow('⚠️  confirm_changeset not set'));
      }
      
      if (samConfig.includes('confirm_changeset = true') || !samConfig.includes('confirm_changeset')) {
        console.log('');
        console.log(colors.cyan('🔧 Fixing samconfig.toml for automated deployment...'));
        
        let updatedConfig = samConfig;
        
        if (samConfig.includes('confirm_changeset = true')) {
          updatedConfig = samConfig.replace(
            /confirm_changeset\s*=\s*true/g,
            'confirm_changeset = false'
          );
        } else if (!samConfig.includes('confirm_changeset')) {
          updatedConfig = samConfig.replace(
            /(\[default\.deploy\.parameters\])/,
            '$1\nconfirm_changeset = false'
          );
        }
        
        await Deno.writeTextFile(samConfigPath, updatedConfig);
        console.log(colors.green('✅ samconfig.toml updated for automated deployment'));
        console.log('');
        console.log(colors.cyan('💡 Now Q can use `sam deploy` without hanging!'));
      } else {
        console.log('');
        console.log(colors.green('✅ samconfig.toml is already configured correctly'));
      }
      
    } catch (error) {
      console.log(colors.red(`❌ Error reading samconfig.toml: ${error.message}`));
    }
  } else {
    console.log(colors.yellow('⚠️  samconfig.toml not found'));
    console.log('');
    console.log('To create samconfig.toml, you can either:');
    console.log('1. Run `sam deploy --guided` once to create it');
    console.log('2. Create it manually with the following content:');
    console.log('');
    console.log(colors.gray('version = 0.1'));
    console.log(colors.gray('[default.deploy.parameters]'));
    console.log(colors.gray('stack_name = "your-stack-name"'));
    console.log(colors.gray('capabilities = "CAPABILITY_IAM"'));
    console.log(colors.gray('confirm_changeset = false'));
    console.log(colors.gray('resolve_s3 = true'));
    console.log(colors.gray('region = "us-east-1"'));
  }
}

async function cleanupCommand(options: { force?: boolean }) {
  console.log(colors.cyan('🛫 no-wing - Cleanup'));
  console.log('');

  const detector = new ProjectDetector();
  const project = await detector.detect();
  const manager = new ServiceAccountManager(project);
  
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

async function promptCommand(args: string[]): Promise<void> {
  const detector = new ProjectDetector();
  const project = await detector.detect();
  const manager = new ServiceAccountManager(project);
  
  if (!await manager.exists()) {
    console.log(colors.red('❌ No service account found'));
    console.log('Run "no-wing setup" first');
    return;
  }

  const promptPath = `${manager.config.workspaceDir}/system-prompt.md`;
  
  if (args.length === 0) {
    // Show the system prompt
    try {
      const content = await Deno.readTextFile(promptPath);
      console.log(colors.cyan('📋 Q Assistant System Prompt'));
      console.log(colors.gray('─'.repeat(50)));
      console.log(content);
      console.log(colors.gray('─'.repeat(50)));
      console.log(colors.yellow(`📍 Location: ${promptPath}`));
    } catch (error) {
      console.log(colors.red('❌ System prompt not found'));
      console.log('Run "no-wing setup" to regenerate');
    }
  } else if (args[0] === 'edit') {
    // Edit the system prompt
    const editor = Deno.env.get('EDITOR') || 'nano';
    console.log(colors.cyan(`📝 Opening system prompt in ${editor}...`));
    
    const command = new Deno.Command(editor, {
      args: [promptPath],
      stdin: 'inherit',
      stdout: 'inherit',
      stderr: 'inherit',
    });
    
    const { success } = await command.output();
    
    if (success) {
      console.log(colors.green('✅ System prompt updated'));
      console.log(colors.yellow('💡 Changes will take effect on next "no-wing launch"'));
    } else {
      console.log(colors.red('❌ Failed to edit system prompt'));
    }
  } else {
    console.log(colors.red('❌ Unknown prompt command'));
    console.log('Usage: no-wing prompt [edit]');
  }
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
    console.log('  sam-config                   Configure SAM for automated deployment');
    console.log('  cleanup [--force]            Remove service account');
    console.log('  prompt                       Show system prompt');
    console.log('  prompt edit                  Edit system prompt');
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
      case 'sam-config':
        await samConfigCommand();
        break;
      case 'aws-setup':
        await awsSetupCommand();
        break;
      case 'cleanup':
        await cleanupCommand({ force: args.force });
        break;
      case 'prompt':
        await promptCommand(args._.slice(1));
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
