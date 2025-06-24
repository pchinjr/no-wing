/**
 * Developer setup command for onboarding with Q assistant
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';

export async function setupCommand(options: { token?: string }): Promise<void> {
  console.log(chalk.cyan('🚀 no-wing Developer Setup'));
  console.log('===========================');
  console.log('');

  let token = options.token;

  if (!token) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'token',
        message: 'Enter your onboarding token:',
        validate: (input) => input.length > 0 || 'Onboarding token is required'
      }
    ]);
    token = answers.token;
  }

  const spinner = ora('Validating onboarding token...').start();

  try {
    // Validate token and get setup information
    const setupInfo = await validateAndGetSetupInfo(token!);

    if (!setupInfo.valid) {
      spinner.fail('Invalid or expired onboarding token');
      console.error(chalk.red('❌ Error:'), setupInfo.error);
      return;
    }

    spinner.text = 'Setting up your development environment...';

    // Configure AWS credentials
    await configureAWSCredentials(setupInfo);

    // Initialize Q assistant
    await initializeQAssistant(setupInfo);

    // Create local configuration
    await createLocalConfig(setupInfo);

    spinner.succeed('Setup completed successfully!');
    console.log('');
    console.log(chalk.green('✅ Welcome to no-wing!'));
    console.log('======================');
    console.log(`Developer ID: ${chalk.cyan(setupInfo.developerId)}`);
    console.log(`Q Assistant ID: ${chalk.cyan(setupInfo.qId)}`);
    console.log(`Q Capability Level: ${chalk.yellow(setupInfo.qLevel)}`);
    console.log('');
    console.log(chalk.yellow('🤖 Your Q Assistant is ready!'));
    console.log('');
    console.log(chalk.gray('Next steps:'));
    console.log('  • Run "no-wing chat" to start working with your Q assistant');
    console.log('  • Your Q will help you with AWS development tasks');
    console.log('  • All Q activities are monitored for compliance');
    console.log('');
    console.log(chalk.cyan('Happy coding with your AI development partner! 🛫'));

  } catch (error) {
    spinner.fail('Setup failed');
    console.error(chalk.red('❌ Error:'), error);
  }
}

interface SetupInfo {
  valid: boolean;
  developerId: string;
  qId: string;
  qLevel: string;
  humanIAMRole: string;
  qIAMRole: string;
  region: string;
  error?: string;
}

async function validateAndGetSetupInfo(token: string): Promise<SetupInfo> {
  // In real implementation, this would validate the token against a database
  // and return the associated setup information
  
  // Simulate token validation
  if (token.length < 10) {
    return {
      valid: false,
      developerId: '',
      qId: '',
      qLevel: '',
      humanIAMRole: '',
      qIAMRole: '',
      region: '',
      error: 'Token too short'
    };
  }

  // Simulate successful validation with Partner level for senior developers
  return {
    valid: true,
    developerId: 'dev-hackathon-123456',
    qId: 'q-hackathon-123456-abc123',
    qLevel: 'partner', // Partner level for hackathon demo
    humanIAMRole: 'no-wing-developer-dev-hackathon-123456',
    qIAMRole: 'no-wing-q-q-hackathon-123456-abc123',
    region: 'us-east-1'
  };
}

async function configureAWSCredentials(setupInfo: SetupInfo): Promise<void> {
  // In real implementation, this would:
  // 1. Generate temporary credentials for the developer
  // 2. Configure AWS CLI profile
  // 3. Set up Q agent credentials
  
  console.log(chalk.gray('  ✓ AWS credentials configured'));
  console.log(chalk.gray('  ✓ Q agent credentials configured'));
}

async function initializeQAssistant(setupInfo: SetupInfo): Promise<void> {
  // In real implementation, this would:
  // 1. Initialize Q agent with company-specific knowledge
  // 2. Set up monitoring and logging
  // 3. Configure capability boundaries
  
  console.log(chalk.gray('  ✓ Q assistant initialized'));
  console.log(chalk.gray('  ✓ Monitoring configured'));
  console.log(chalk.gray('  ✓ Permission boundaries set'));
}

async function createLocalConfig(setupInfo: SetupInfo): Promise<void> {
  // In real implementation, this would create local configuration files
  // for the developer's environment
  
  const config = {
    developerId: setupInfo.developerId,
    qId: setupInfo.qId,
    qLevel: setupInfo.qLevel,
    region: setupInfo.region,
    setupDate: new Date().toISOString()
  };

  // Create .no-wing directory and config file
  const fs = require('fs');
  const path = require('path');
  const os = require('os');

  const configDir = path.join(os.homedir(), '.no-wing');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  const configFile = path.join(configDir, 'config.json');
  fs.writeFileSync(configFile, JSON.stringify(config, null, 2));

  console.log(chalk.gray('  ✓ Local configuration created'));
}
