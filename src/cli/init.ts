import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { OnboardingOrchestrator } from '../lambda/orchestrator';
import { QDialogue } from '../q/dialogue';
import { QIdentityManager } from '../q/identity';

interface InitOptions {
  name?: string;
  repo?: string;
  env?: string;
  region?: string;
}

export async function initCommand(options: InitOptions): Promise<void> {
  console.log(chalk.blue.bold('🛫 Welcome to no-wing - Autonomous Developer Onboarding'));
  console.log(chalk.gray('Preparing to onboard you and your AI teammate Q...\n'));

  // Collect missing information
  const config = await collectConfig(options);
  
  // Initialize Q dialogue
  const qDialogue = new QDialogue(config.name);
  qDialogue.greet();

  // Start onboarding process
  const orchestrator = new OnboardingOrchestrator(config);
  
  try {
    await runOnboardingSteps(orchestrator, qDialogue);
    
    // Create local environment
    await createLocalEnvironment(config);
    
    qDialogue.celebrate();
    
  } catch (error) {
    console.error(chalk.red('❌ Onboarding failed:'), error);
    qDialogue.troubleshoot();
    process.exit(1);
  }
}

async function collectConfig(options: InitOptions) {
  const questions = [];

  if (!options.name) {
    questions.push({
      type: 'input',
      name: 'name',
      message: 'What\'s your name?',
      validate: (input: string) => input.length > 0 || 'Name is required'
    });
  }

  if (!options.repo) {
    questions.push({
      type: 'input',
      name: 'repo',
      message: 'GitHub repository (owner/repo):',
      validate: (input: string) => {
        const repoPattern = /^[\w\-\.]+\/[\w\-\.]+$/;
        return repoPattern.test(input) || 'Please enter a valid repo format (owner/repo)';
      }
    });
  }

  const answers = await inquirer.prompt(questions);
  
  return {
    name: options.name || answers.name,
    repo: options.repo || answers.repo,
    env: options.env || 'dev',
    region: options.region || 'us-east-1'
  };
}

async function runOnboardingSteps(orchestrator: OnboardingOrchestrator, qDialogue: QDialogue) {
  const steps = [
    { name: 'Creating Q\'s identity and capabilities', fn: () => createQIdentity() },
    { name: 'Creating IAM roles for you and Q', fn: () => orchestrator.createRoles() },
    { name: 'Setting up AWS credentials', fn: () => orchestrator.setupCredentials() },
    { name: 'Authenticating Q as your teammate', fn: () => orchestrator.authenticateQ() },
    { name: 'Bootstrapping GitHub Actions', fn: () => orchestrator.setupGitHub() },
    { name: 'Configuring deployment pipeline', fn: () => orchestrator.setupPipeline() }
  ];

  for (const step of steps) {
    const spinner = ora(step.name).start();
    
    try {
      await step.fn();
      spinner.succeed(chalk.green(step.name));
      qDialogue.stepComplete(step.name);
    } catch (error) {
      spinner.fail(chalk.red(`Failed: ${step.name}`));
      throw error;
    }
  }
}

async function createQIdentity() {
  const identityManager = new QIdentityManager();
  
  // Check if Q already exists
  const existingIdentity = await identityManager.loadIdentity();
  if (existingIdentity) {
    console.log(chalk.yellow('Q identity already exists, skipping creation'));
    return;
  }
  
  // Create new Q identity
  const identity = await identityManager.createIdentity('Q');
  console.log(chalk.green(`Created Q identity: ${identity.id}`));
  console.log(chalk.cyan(`Q starts at ${identity.level.toUpperCase()} level with ${identity.permissions.length} permissions`));
}

async function createLocalEnvironment(config: any) {
  const spinner = ora('Creating local environment files').start();
  
  try {
    // Create .env file
    const envContent = `
# no-wing generated environment
PROJECT_NAME=${config.name}
GITHUB_REPO=${config.repo}
AWS_REGION=${config.region}
ENVIRONMENT=${config.env}

# Q Configuration
Q_ROLE_ARN=arn:aws:iam::ACCOUNT:role/QRole-${config.name}
Q_CAPABILITIES_LEVEL=1

# Generated on ${new Date().toISOString()}
`.trim();

    writeFileSync('.env', envContent);
    
    // Create .no-wing directory for metadata
    if (!existsSync('.no-wing')) {
      mkdirSync('.no-wing');
    }
    
    const metadataContent = {
      version: '0.1.0',
      created: new Date().toISOString(),
      developer: config.name,
      repo: config.repo,
      environment: config.env,
      region: config.region,
      qCapabilities: 1
    };
    
    writeFileSync('.no-wing/metadata.json', JSON.stringify(metadataContent, null, 2));
    
    spinner.succeed('Local environment configured');
  } catch (error) {
    spinner.fail('Failed to create local environment');
    throw error;
  }
}
