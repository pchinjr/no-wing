import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { OnboardingOrchestrator } from '../lambda/orchestrator';
import { QDialogue } from '../q/dialogue';
import { QIdentityManager } from '../q/identity';
import { QGitIdentityManager } from '../q/git-identity';

interface InitOptions {
  name?: string;
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
      message: 'What is your name?',
      default: 'Developer'
    });
  }

  if (!options.env) {
    questions.push({
      type: 'list',
      name: 'env',
      message: 'Which environment?',
      choices: ['dev', 'staging', 'prod'],
      default: 'dev'
    });
  }

  if (!options.region) {
    questions.push({
      type: 'list',
      name: 'region',
      message: 'Which AWS region?',
      choices: ['us-east-1', 'us-west-2', 'eu-west-1'],
      default: 'us-east-1'
    });
  }

  const answers = await inquirer.prompt(questions);
  
  return {
    name: options.name || answers.name,
    env: options.env || answers.env,
    region: options.region || answers.region
  };
}

async function runOnboardingSteps(orchestrator: OnboardingOrchestrator, qDialogue: QDialogue) {
  const steps = [
    {
      name: 'Creating Q\'s identity and capabilities',
      action: () => orchestrator.createQIdentity()
    },
    {
      name: 'Creating IAM roles for you and Q',
      action: () => orchestrator.createIAMRoles()
    },
    {
      name: 'Setting up AWS credentials',
      action: () => orchestrator.setupAWSCredentials()
    },
    {
      name: 'Authenticating Q as your teammate',
      action: () => orchestrator.authenticateQ()
    }
  ];

  for (const step of steps) {
    const spinner = ora(step.name).start();
    
    try {
      await step.action();
      spinner.succeed();
      qDialogue.encourageProgress();
    } catch (error) {
      spinner.fail(`Failed: ${step.name}`);
      throw error;
    }
  }
}

async function createLocalEnvironment(config: any) {
  // Create .no-wing directory
  const noWingDir = './.no-wing';
  if (!existsSync(noWingDir)) {
    mkdirSync(noWingDir, { recursive: true });
  }

  // Create local config
  const localConfig = {
    name: config.name,
    env: config.env,
    region: config.region,
    createdAt: new Date().toISOString()
  };

  writeFileSync(
    join(noWingDir, 'config.json'),
    JSON.stringify(localConfig, null, 2)
  );

  console.log(chalk.green('\n✅ Local environment configured'));
}
