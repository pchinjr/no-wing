/**
 * Setup Command - Create Q service account for current project
 */

import chalk from 'chalk';
import ora from 'ora';
import { ProjectDetector } from '../services/ProjectDetector.js';
import { ServiceAccountManager } from '../services/ServiceAccountManager.js';

interface SetupOptions {
  dryRun?: boolean;
  force?: boolean;
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
    
    if (options.dryRun) {
      console.log(chalk.cyan('🔍 Dry run complete - no changes made'));
      return;
    }
    
    // Check if service account already exists
    const manager = new ServiceAccountManager(qConfig);
    const currentStatus = await manager.getStatus();
    
    if (currentStatus.exists && !options.force) {
      spinner.fail('Service account already exists');
      console.log('');
      console.log(chalk.yellow('⚠️  Service account already exists:'));
      console.log(`  Username: ${qConfig.username}`);
      console.log('');
      console.log(chalk.cyan('Options:'));
      console.log('  no-wing setup --force    # Recreate service account');
      console.log('  no-wing status           # Check current status');
      console.log('  no-wing cleanup          # Remove existing account');
      return;
    }
    
    if (options.force && currentStatus.exists) {
      spinner.text = 'Removing existing service account...';
      await manager.cleanup();
    }
    
    // Create the service account
    spinner.text = 'Creating local user account...';
    await manager.create();
    
    spinner.succeed('Q service account created successfully!');
    
    console.log('');
    console.log(chalk.green('✅ Setup Complete'));
    console.log('');
    console.log(chalk.yellow('📋 What was created:'));
    console.log(`  • Local user: ${chalk.green(qConfig.username)}`);
    console.log(`  • Git identity: ${chalk.green(qConfig.gitIdentity.name)}`);
    console.log(`  • Home directory: ${chalk.gray(qConfig.homeDirectory)}`);
    console.log(`  • Workspace: ${chalk.gray(qConfig.workspace)}`);
    console.log('');
    console.log(chalk.yellow('⚠️  Still needed:'));
    console.log('  • AWS IAM user and credentials (Phase 2)');
    console.log('  • SSH keys for git access (Phase 2)');
    console.log('');
    console.log(chalk.cyan('🚀 Next steps:'));
    console.log('  no-wing status           # Check service account health');
    console.log('  no-wing permissions      # Configure AWS permissions');
    console.log('  no-wing launch           # Launch Q with service account identity');
    
  } catch (error) {
    spinner.fail('Setup failed');
    console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : 'Unknown error');
    
    if (error instanceof Error && error.message.includes('sudo')) {
      console.log('');
      console.log(chalk.yellow('💡 This command requires sudo access to create local user accounts.'));
      console.log('   Make sure you can run sudo commands on this system.');
    }
    
    process.exit(1);
  }
}
