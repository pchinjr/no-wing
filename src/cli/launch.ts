/**
 * Launch Command - Launch Amazon Q with service account identity
 */

import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { ProjectDetector } from '../services/ProjectDetector.js';
import { ServiceAccountManager } from '../services/ServiceAccountManager.js';
import { QSessionManager } from '../services/QSessionManager.js';
import { QCliDetector } from '../services/QCliDetector.js';

interface LaunchOptions {
  background?: boolean;
  verbose?: boolean;
  qCliArgs?: string[];
}

export async function launchCommand(options: LaunchOptions = {}) {
  console.log(chalk.cyan('🛫 no-wing - Launch Q with Service Account Identity'));
  console.log('');

  const spinner = ora('Preparing Q launch...').start();

  try {
    // First, check if Q CLI is available
    spinner.text = 'Checking Q CLI availability...';
    const qDetector = new QCliDetector();
    const qInfo = await qDetector.detectQCli();
    
    if (!qInfo.available) {
      spinner.fail('Q CLI not found');
      console.log('');
      console.log(chalk.red('❌ Amazon Q CLI is not installed or not available'));
      console.log(`   ${qInfo.error || 'Q CLI command not found'}`);
      console.log('');
      
      // Provide installation guidance
      const guidance = qDetector.getInstallationGuidance();
      console.log(chalk.yellow(`📦 Q CLI Installation Guide (${guidance.platform}):`));
      guidance.instructions.forEach(instruction => {
        if (instruction.trim()) {
          console.log(`   ${instruction}`);
        } else {
          console.log('');
        }
      });
      
      if (guidance.links.length > 0) {
        console.log('');
        console.log(chalk.cyan('🔗 Documentation:'));
        guidance.links.forEach(link => {
          console.log(`   ${link}`);
        });
      }
      
      console.log('');
      console.log(chalk.gray('💡 After installing Q CLI, run this command again to launch Q with service account identity.'));
      return;
    }

    // Check Q CLI compatibility
    spinner.text = 'Validating Q CLI compatibility...';
    const compatibility = await qDetector.checkCompatibility();
    
    if (!compatibility.compatible) {
      spinner.fail('Q CLI compatibility issues');
      console.log('');
      console.log(chalk.yellow('⚠️  Q CLI compatibility issues detected:'));
      console.log(`   Current version: ${compatibility.version}`);
      console.log(`   Minimum required: ${compatibility.minVersion}`);
      console.log('');
      
      if (compatibility.issues) {
        console.log(chalk.red('Issues:'));
        compatibility.issues.forEach(issue => {
          console.log(`   • ${issue}`);
        });
        console.log('');
      }
      
      console.log(chalk.cyan('🔧 To fix:'));
      console.log('   • Update Q CLI to the latest version');
      console.log('   • Check Q CLI documentation for compatibility requirements');
      console.log('');
      
      const { proceed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'proceed',
          message: 'Try to launch anyway? (may not work correctly)',
          default: false
        }
      ]);
      
      if (!proceed) {
        console.log(chalk.gray('Launch cancelled due to compatibility issues'));
        return;
      }
    } else {
      spinner.text = `Q CLI detected (v${qInfo.version}) - compatible ✓`;
    }

    // Continue with existing service account validation...
    // Detect current project and generate Q config
    spinner.text = 'Detecting project configuration...';
    const detector = new ProjectDetector();
    const projectType = await detector.detect();
    const qConfig = await detector.generateQConfig();
    
    // Check service account status
    spinner.text = 'Validating Q service account...';
    const manager = new ServiceAccountManager(qConfig);
    const status = await manager.getStatus();
    
    if (!status.exists) {
      spinner.fail('Q service account not found');
      console.log('');
      console.log(chalk.red('❌ Q service account does not exist'));
      console.log(`  Expected username: ${qConfig.username}`);
      console.log('');
      console.log(chalk.cyan('🚀 To create Q service account:'));
      console.log('  no-wing setup    # Create Q service account');
      return;
    }

    if (!status.healthy) {
      spinner.fail('Q service account is not healthy');
      console.log('');
      console.log(chalk.yellow('⚠️  Q service account exists but is not healthy:'));
      
      if (!status.localUser) {
        console.log('  • Local user: Missing');
      }
      if (!status.gitConfigured) {
        console.log('  • Git identity: Not configured');
      }
      if (!status.awsConfigured) {
        console.log('  • AWS identity: Not configured');
      }
      if (!status.workspace) {
        console.log('  • Workspace: Not configured');
      }
      
      console.log('');
      console.log(chalk.cyan('🔧 To fix Q service account:'));
      console.log('  no-wing setup --force    # Recreate service account');
      console.log('  no-wing status --verbose # Check detailed status');
      return;
    }

    spinner.succeed('Q service account validated');
    
    // Show what Q will have access to
    console.log('');
    console.log(chalk.yellow('🔐 Q Identity Summary:'));
    console.log(`  • User: ${chalk.green(qConfig.username)}`);
    console.log(`  • Git: ${chalk.green(qConfig.gitIdentity.name)} <${qConfig.gitIdentity.email}>`);
    console.log(`  • AWS Profile: ${chalk.green(qConfig.awsProfile)}`);
    console.log(`  • Project: ${chalk.green(projectType.name)} (${projectType.type.toUpperCase()})`);
    console.log(`  • Workspace: ${chalk.gray(qConfig.workspace)}`);
    console.log('');

    // Show AWS account info if available
    try {
      const accountInfo = await manager.getAWSAccountInfo();
      if (accountInfo) {
        console.log(chalk.yellow('☁️  AWS Context:'));
        console.log(`  • Account: ${chalk.gray(accountInfo.accountId)}`);
        console.log(`  • Region: ${chalk.gray(accountInfo.region)}`);
        console.log('');
      }
    } catch {
      // AWS info not available, continue
    }

    // Security confirmation
    if (!options.background) {
      console.log(chalk.cyan('🛡️  Security Notes:'));
      console.log('  • Q will operate with its own identity, not yours');
      console.log('  • Q commits will show "Q Assistant" as the author');
      console.log('  • Q will use its own AWS credentials for deployments');
      console.log('  • All Q actions will be logged and auditable');
      console.log('');

      const { proceed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'proceed',
          message: 'Launch Q with service account identity?',
          default: true
        }
      ]);

      if (!proceed) {
        console.log(chalk.gray('Launch cancelled'));
        return;
      }
    }

    // Initialize Q session manager
    const sessionManager = new QSessionManager(qConfig);
    
    // Check if there's already an active session
    const currentStatus = sessionManager.getSessionStatus();
    if (currentStatus.active) {
      console.log(chalk.yellow('⚠️  Q session already active'));
      console.log(`  Session ID: ${currentStatus.sessionId}`);
      console.log(`  Started: ${currentStatus.startTime?.toLocaleString()}`);
      console.log(`  PID: ${currentStatus.pid}`);
      console.log('');
      
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices: [
            { name: 'Stop current session and start new one', value: 'restart' },
            { name: 'Show session status', value: 'status' },
            { name: 'Cancel', value: 'cancel' }
          ]
        }
      ]);

      if (action === 'cancel') {
        return;
      } else if (action === 'status') {
        console.log(chalk.green('✅ Q session is active and running'));
        return;
      } else if (action === 'restart') {
        const stopSpinner = ora('Stopping current Q session...').start();
        await sessionManager.stopSession();
        stopSpinner.succeed('Current session stopped');
      }
    }

    // Launch Q session
    const launchSpinner = ora('Launching Q with service account identity...').start();
    
    try {
      const sessionConfig = await sessionManager.launchQ(process.cwd());
      
      launchSpinner.succeed('Q launched successfully!');
      
      console.log('');
      console.log(chalk.green('🚀 Q Assistant is now running with its own identity'));
      console.log('');
      console.log(chalk.yellow('📋 Session Information:'));
      console.log(`  • Session ID: ${chalk.green(sessionConfig.sessionId)}`);
      console.log(`  • Started: ${chalk.gray(sessionConfig.startTime.toLocaleString())}`);
      console.log(`  • Working Directory: ${chalk.gray(sessionConfig.workingDirectory)}`);
      console.log(`  • Q Workspace: ${chalk.gray(qConfig.workspace)}`);
      console.log('');
      
      console.log(chalk.cyan('🎯 What Q can do now:'));
      console.log('  • Make git commits with Q Assistant identity');
      console.log('  • Deploy AWS resources using Q\'s credentials');
      console.log('  • Operate in isolated workspace environment');
      console.log('  • All actions logged and attributed to Q');
      console.log('');
      
      if (options.verbose) {
        console.log(chalk.gray('🔍 Technical Details:'));
        console.log(chalk.gray(`  • Q User: ${qConfig.username}`));
        console.log(chalk.gray(`  • Q Home: ${qConfig.homeDirectory}`));
        console.log(chalk.gray(`  • Git Author: ${qConfig.gitIdentity.name}`));
        console.log(chalk.gray(`  • AWS Profile: ${qConfig.awsProfile}`));
        console.log('');
      }
      
      console.log(chalk.yellow('💡 To stop Q session:'));
      console.log('  • Exit the Q shell session');
      console.log('  • Or run: no-wing stop (when implemented)');
      console.log('');
      
      console.log(chalk.green('✨ Q is now operating with its own identity - no more masquerading!'));
      
    } catch (launchError) {
      launchSpinner.fail('Failed to launch Q');
      throw launchError;
    }
    
  } catch (error) {
    spinner.fail('Launch failed');
    console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : 'Unknown error');
    
    if (error instanceof Error) {
      if (error.message.includes('does not exist')) {
        console.log('');
        console.log(chalk.yellow('💡 Service account issue:'));
        console.log('   • Run "no-wing status" to check service account health');
        console.log('   • Run "no-wing setup" to create or fix service account');
      } else if (error.message.includes('sudo') || error.message.includes('permission')) {
        console.log('');
        console.log(chalk.yellow('💡 Permission issue:'));
        console.log('   • Q launch requires sudo access to switch user context');
        console.log('   • Make sure you can run sudo commands on this system');
      }
    }
    
    process.exit(1);
  }
}
