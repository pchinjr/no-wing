/**
 * Setup Command - Create Q service account for current project
 */

import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { ProjectDetector } from '../services/ProjectDetector.js';
import { ServiceAccountManager } from '../services/ServiceAccountManager.js';
import { PolicyGenerator } from '../services/PolicyGenerator.js';

interface SetupOptions {
  dryRun?: boolean;
  force?: boolean;
  skipAws?: boolean;
}

export async function setupCommand(options: SetupOptions = {}) {
  console.log(chalk.cyan('🛫 no-wing - Q Service Account Setup'));
  console.log('');

  if (options.dryRun) {
    console.log(chalk.yellow('🔍 Dry run mode - showing what would be created'));
    console.log('');
  }

  const spinner = ora('Analyzing current project...').start();

  try {
    // Detect project type and generate Q config
    spinner.text = 'Detecting project type...';
    const detector = new ProjectDetector();
    const projectType = await detector.detect();
    const qConfig = await detector.generateQConfig();
    
    spinner.text = 'Generating service account configuration...';
    
    console.log('');
    spinner.info(`Detected ${chalk.green(projectType.type.toUpperCase())} project: ${chalk.bold(projectType.name)}`);
    
    if (projectType.configFile) {
      console.log(chalk.gray(`  Config file: ${projectType.configFile}`));
    }
    console.log(chalk.gray(`  Deploy command: ${projectType.deployCommand}`));
    console.log(chalk.gray(`  Required permissions: ${projectType.permissions.length} policies`));
    console.log('');
    
    // Show what will be created
    console.log(chalk.yellow('📋 Service Account Configuration:'));
    console.log(`  • Username: ${chalk.green(qConfig.username)}`);
    console.log(`  • Home Directory: ${chalk.gray(qConfig.homeDirectory)}`);
    console.log(`  • Workspace: ${chalk.gray(qConfig.workspace)}`);
    console.log(`  • Git Identity: ${chalk.green(qConfig.gitIdentity.name)}`);
    console.log(`  • Git Email: ${chalk.gray(qConfig.gitIdentity.email)}`);
    console.log(`  • AWS Profile: ${chalk.green(qConfig.awsProfile)}`);
    console.log('');

    // Show AWS permissions
    const manager = new ServiceAccountManager(qConfig);
    const policySummary = manager.getPolicySummary();
    console.log(chalk.yellow('🔐 AWS Permissions:'));
    policySummary.forEach(line => {
      console.log(`  ${line}`);
    });
    console.log('');
    
    if (options.dryRun) {
      console.log(chalk.cyan('🔍 Dry run complete - no changes made'));
      return;
    }
    
    // Check if service account already exists
    const currentStatus = await manager.getStatus();
    
    if (currentStatus.exists && !options.force) {
      spinner.fail('Service account already exists');
      console.log('');
      console.log(chalk.yellow('⚠️  Service account already exists:'));
      console.log(`  Username: ${qConfig.username}`);
      if (currentStatus.awsUser) {
        console.log(`  AWS User: ${chalk.green('✅ Created')}`);
      } else {
        console.log(`  AWS User: ${chalk.red('❌ Not created')}`);
      }
      console.log('');
      console.log(chalk.cyan('Options:'));
      console.log('  no-wing setup --force       # Recreate service account');
      console.log('  no-wing setup --skip-aws    # Skip AWS setup');
      console.log('  no-wing status              # Check current status');
      console.log('  no-wing cleanup             # Remove existing account');
      return;
    }
    
    if (options.force && currentStatus.exists) {
      spinner.text = 'Removing existing service account...';
      await manager.cleanup();
    }

    // Ask about AWS setup if not specified
    let includeAWS = !options.skipAws;
    if (!options.skipAws && !options.force) {
      const { setupAWS } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'setupAWS',
          message: 'Create AWS IAM user and credentials for Q?',
          default: true
        }
      ]);
      includeAWS = setupAWS;
    }
    
    // Create the service account
    spinner.text = 'Creating local user account...';
    
    if (includeAWS) {
      spinner.text = 'Creating service account with AWS integration...';
      await manager.create(options.force, true);
    } else {
      spinner.text = 'Creating service account (local only)...';
      await manager.create(options.force, false);
    }
    
    spinner.succeed('Q service account created successfully!');
    
    console.log('');
    console.log(chalk.green('✅ Setup Complete'));
    console.log('');
    console.log(chalk.yellow('📋 What was created:'));
    console.log(`  • Local user: ${chalk.green(qConfig.username)}`);
    console.log(`  • Git identity: ${chalk.green(qConfig.gitIdentity.name)}`);
    console.log(`  • Home directory: ${chalk.gray(qConfig.homeDirectory)}`);
    console.log(`  • Workspace: ${chalk.gray(qConfig.workspace)}`);
    
    if (includeAWS) {
      console.log(`  • AWS IAM user: ${chalk.green(qConfig.username)}`);
      console.log(`  • AWS profile: ${chalk.green(qConfig.awsProfile)}`);
      console.log(`  • AWS credentials: ${chalk.gray('Configured')}`);
      
      // Show account info if available
      try {
        const accountInfo = await manager.getAWSAccountInfo();
        if (accountInfo) {
          console.log(`  • AWS Account: ${chalk.gray(accountInfo.accountId)}`);
          console.log(`  • AWS Region: ${chalk.gray(accountInfo.region)}`);
        }
      } catch {
        // Ignore if we can't get account info
      }
    } else {
      console.log(`  • AWS setup: ${chalk.yellow('Skipped')}`);
    }
    
    console.log('');
    
    if (!includeAWS) {
      console.log(chalk.yellow('⚠️  AWS setup was skipped:'));
      console.log('  • Q cannot deploy AWS resources yet');
      console.log('  • Run setup again without --skip-aws to add AWS integration');
      console.log('');
    }
    
    console.log(chalk.cyan('🚀 Next steps:'));
    console.log('  no-wing status           # Check service account health');
    if (includeAWS) {
      console.log('  no-wing permissions      # Review AWS permissions');
      console.log('  no-wing launch           # Launch Q with full AWS access');
    } else {
      console.log('  no-wing setup            # Add AWS integration');
      console.log('  no-wing launch           # Launch Q (local operations only)');
    }
    
  } catch (error) {
    spinner.fail('Setup failed');
    console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : 'Unknown error');
    
    if (error instanceof Error) {
      if (error.message.includes('sudo')) {
        console.log('');
        console.log(chalk.yellow('💡 This command requires sudo access to create local user accounts.'));
        console.log('   Make sure you can run sudo commands on this system.');
      } else if (error.message.includes('AWS') || error.message.includes('IAM')) {
        console.log('');
        console.log(chalk.yellow('💡 AWS setup failed. You can:'));
        console.log('   • Check your AWS credentials and permissions');
        console.log('   • Run with --skip-aws to create local account only');
        console.log('   • Add AWS integration later with another setup run');
      }
    }
    
    process.exit(1);
  }
}
