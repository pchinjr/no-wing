/**
 * Status Command - Show Q service account status and health
 */

import chalk from 'chalk';
import { ProjectDetector } from '../services/ProjectDetector.js';
import { ServiceAccountManager } from '../services/ServiceAccountManager.js';

interface StatusOptions {
  verbose?: boolean;
}

export async function statusCommand(options: StatusOptions = {}) {
  console.log(chalk.cyan('🛫 no-wing - Q Service Account Status'));
  console.log('');

  try {
    // Detect current project and generate expected Q config
    const detector = new ProjectDetector();
    const projectType = await detector.detect();
    const qConfig = await detector.generateQConfig();
    
    console.log(chalk.yellow('📊 Project Information'));
    console.log(`  Type: ${chalk.green(projectType.type.toUpperCase())}`);
    console.log(`  Name: ${chalk.green(projectType.name)}`);
    if (projectType.configFile) {
      console.log(`  Config: ${chalk.gray(projectType.configFile)}`);
    }
    console.log(`  Deploy: ${chalk.gray(projectType.deployCommand)}`);
    console.log('');
    
    // Check service account status
    const manager = new ServiceAccountManager(qConfig);
    const status = await manager.getStatus();
    
    console.log(chalk.yellow('🔐 Service Account Status'));
    console.log('');
    
    // Local User Status
    const userIcon = status.localUser ? '✅' : '❌';
    const userColor = status.localUser ? chalk.green : chalk.red;
    console.log(`${userIcon} ${userColor('Local User:')} ${qConfig.username}`);
    if (status.localUser) {
      console.log(chalk.gray(`   Home: ${qConfig.homeDirectory}`));
      console.log(chalk.gray(`   Shell: /bin/bash`));
    } else {
      console.log(chalk.gray('   Status: Not created'));
    }
    console.log('');
    
    // Git Identity Status
    const gitIcon = status.gitConfigured ? '✅' : '❌';
    const gitColor = status.gitConfigured ? chalk.green : chalk.red;
    console.log(`${gitIcon} ${gitColor('Git Identity:')} ${qConfig.gitIdentity.name}`);
    if (status.gitConfigured) {
      console.log(chalk.gray(`   Email: ${qConfig.gitIdentity.email}`));
      console.log(chalk.gray(`   Config: ${qConfig.homeDirectory}/.gitconfig`));
    } else {
      console.log(chalk.gray('   Status: Not configured'));
    }
    console.log('');
    
    // AWS Identity Status
    const awsIcon = status.awsConfigured ? '✅' : '❌';
    const awsColor = status.awsConfigured ? chalk.green : chalk.red;
    console.log(`${awsIcon} ${awsColor('AWS Identity:')} ${qConfig.awsProfile}`);
    
    if (status.awsConfigured) {
      console.log(chalk.gray(`   Profile: ${qConfig.awsProfile}`));
      console.log(chalk.gray(`   Credentials: ${qConfig.homeDirectory}/.aws/credentials`));
      
      // AWS User Status
      if (status.awsUser !== undefined) {
        const awsUserIcon = status.awsUser ? '✅' : '❌';
        const awsUserColor = status.awsUser ? chalk.green : chalk.red;
        console.log(`   ${awsUserIcon} ${awsUserColor('IAM User:')} ${status.awsUser ? 'Created' : 'Not found'}`);
      }
      
      // AWS Credentials Status
      if (status.awsCredentials !== undefined) {
        const credsIcon = status.awsCredentials ? '✅' : '❌';
        const credsColor = status.awsCredentials ? chalk.green : chalk.red;
        console.log(`   ${credsIcon} ${credsColor('Credentials:')} ${status.awsCredentials ? 'Valid' : 'Missing'}`);
      }
      
      // Show AWS account info
      try {
        const accountInfo = await manager.getAWSAccountInfo();
        if (accountInfo) {
          console.log(chalk.gray(`   Account: ${accountInfo.accountId}`));
          console.log(chalk.gray(`   Region: ${accountInfo.region}`));
        }
      } catch {
        console.log(chalk.gray('   Account: Unable to retrieve'));
      }
    } else {
      console.log(chalk.gray('   Status: Not configured'));
    }
    console.log('');
    
    // Workspace Status
    const workspaceIcon = status.workspace ? '✅' : '❌';
    const workspaceColor = status.workspace ? chalk.green : chalk.red;
    console.log(`${workspaceIcon} ${workspaceColor('Workspace:')} ${qConfig.workspace}`);
    if (status.workspace) {
      console.log(chalk.gray(`   Location: ${qConfig.workspace}`));
      console.log(chalk.gray(`   README: Available`));
    } else {
      console.log(chalk.gray('   Status: Not configured'));
    }
    console.log('');
    
    // Home Directory Status
    const homeIcon = status.homeDirectory ? '✅' : '❌';
    const homeColor = status.homeDirectory ? chalk.green : chalk.red;
    console.log(`${homeIcon} ${homeColor('Home Directory:')} ${qConfig.homeDirectory}`);
    if (status.homeDirectory) {
      console.log(chalk.gray('   Structure: .aws/, .ssh/, .no-wing/, workspace/'));
    } else {
      console.log(chalk.gray('   Status: Not configured'));
    }
    console.log('');

    // Overall Health
    const healthIcon = status.healthy ? '✅' : '⚠️';
    const healthColor = status.healthy ? chalk.green : chalk.yellow;
    const healthStatus = status.healthy ? 'Healthy' : 'Needs Setup';
    console.log(`${healthIcon} ${healthColor('Overall Status:')} ${healthStatus}`);
    console.log('');

    // Show AWS permissions if verbose and AWS is configured
    if (options.verbose && (status.awsConfigured || status.exists)) {
      console.log(chalk.yellow('🔍 Detailed Information'));
      console.log('');
      
      console.log(chalk.gray('AWS Permissions Summary:'));
      const policySummary = manager.getPolicySummary();
      policySummary.forEach(line => {
        console.log(chalk.gray(`  ${line}`));
      });
      console.log('');
      
      console.log(chalk.gray('Service Account Configuration:'));
      console.log(chalk.gray(`  Username: ${qConfig.username}`));
      console.log(chalk.gray(`  Project: ${qConfig.projectName}`));
      console.log(chalk.gray(`  Type: ${qConfig.projectType.type}`));
      console.log('');
    }
    
    // Next Steps
    if (!status.exists) {
      console.log(chalk.cyan('🚀 Next Steps:'));
      console.log('  no-wing setup            # Create Q service account');
      console.log('  no-wing setup --skip-aws # Create local-only account');
    } else if (!status.healthy) {
      console.log(chalk.cyan('🔧 Recommended Actions:'));
      if (!status.awsConfigured) {
        console.log('  no-wing setup            # Add AWS integration');
      }
      if (!status.gitConfigured || !status.workspace) {
        console.log('  no-wing setup --force    # Recreate service account');
      }
      if (status.awsConfigured && !status.awsUser) {
        console.log('  no-wing setup --force    # Recreate with AWS user');
      }
    } else {
      console.log(chalk.cyan('🚀 Ready to use:'));
      console.log('  no-wing launch           # Launch Q with service account identity');
      console.log('  no-wing audit            # View Q activity log');
      console.log('  no-wing permissions      # Review AWS permissions');
    }
    
  } catch (error) {
    console.error(chalk.red('❌ Error checking status:'), error instanceof Error ? error.message : 'Unknown error');
    
    if (error instanceof Error && error.message.includes('AWS')) {
      console.log('');
      console.log(chalk.yellow('💡 AWS status check failed:'));
      console.log('   • Check your AWS credentials and permissions');
      console.log('   • The local service account may still be functional');
      console.log('   • Use --verbose for more details');
    }
    
    process.exit(1);
  }
}
