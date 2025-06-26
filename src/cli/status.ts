/**
 * Status command - Show project analysis and Q configuration
 */

import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ProjectAnalyzer } from '../services/ProjectAnalyzer';

export async function statusCommand(): Promise<void> {
  console.log(chalk.cyan('📊 Project Status & Q Guardian Configuration'));
  console.log('============================================');
  console.log('');

  try {
    // Analyze current project
    const analyzer = new ProjectAnalyzer();
    const projectContext = await analyzer.analyzeProject();

    console.log(chalk.yellow('📁 Project Analysis:'));
    console.log(`   Name: ${chalk.cyan(projectContext.name)}`);
    console.log(`   Path: ${chalk.gray(projectContext.path)}`);
    console.log(`   Type: ${chalk.cyan(projectContext.type.toUpperCase())}`);
    console.log(`   AWS Account: ${chalk.cyan(projectContext.awsAccountId)}`);
    console.log(`   AWS Region: ${chalk.cyan(projectContext.awsRegion)}`);
    
    if (projectContext.gitRepo?.isRepo) {
      console.log(`   Git Branch: ${chalk.cyan(projectContext.gitRepo.branch)}`);
      if (projectContext.gitRepo.authorName) {
        console.log(`   Git Author: ${chalk.cyan(projectContext.gitRepo.authorName)} <${projectContext.gitRepo.authorEmail}>`);
      }
    } else {
      console.log(`   Git: ${chalk.gray('Not a git repository')}`);
    }

    if (projectContext.type === 'sam') {
      console.log(`   SAM Template: ${chalk.cyan(projectContext.samTemplate || 'Not found')}`);
      console.log(`   Lambda Functions: ${chalk.cyan(projectContext.lambdaFunctions?.length || 0)}`);
      
      if (projectContext.lambdaFunctions?.length) {
        console.log(`   Functions: ${chalk.gray(projectContext.lambdaFunctions.map(f => f.name).join(', '))}`);
      }
    }

    console.log('');

    // Check Q Guardian configuration
    const configPath = path.join(os.homedir(), '.no-wing', 'q-config.json');
    
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      console.log(chalk.yellow('🛡️ Q Guardian Configuration:'));
      console.log(`   Status: ${chalk.green('Configured')}`);
      console.log(`   Configured Project: ${chalk.cyan(config.projectContext.name)}`);
      console.log(`   Commit Author: ${chalk.cyan(config.commitAuthor.name)} <${config.commitAuthor.email}>`);
      console.log(`   Auto Commit: ${config.preferences.autoCommit ? chalk.green('Enabled') : chalk.gray('Disabled')}`);
      console.log(`   Deploy on Create: ${config.preferences.deployOnCreate ? chalk.green('Enabled') : chalk.gray('Disabled')}`);
      
      // Check if current project matches configured project
      if (config.projectContext.path !== projectContext.path) {
        console.log('');
        console.log(chalk.yellow('⚠️  Configuration Mismatch:'));
        console.log(`   Q is configured for: ${chalk.gray(config.projectContext.path)}`);
        console.log(`   Current directory: ${chalk.gray(projectContext.path)}`);
        console.log('   Run "no-wing configure" to update configuration');
      }
      
    } else {
      console.log(chalk.yellow('🛡️ Q Guardian Configuration:'));
      console.log(`   Status: ${chalk.red('Not configured')}`);
      console.log('   Run "no-wing configure" to set up Q Guardian');
    }

    console.log('');
    console.log(chalk.yellow('🚀 Available Commands:'));
    console.log('   no-wing configure    # Configure Q for this project');
    console.log('   no-wing launch       # Launch Q with project context');
    console.log('   no-wing setup        # Configure and launch in one step');

  } catch (error) {
    console.error(chalk.red('❌ Error getting status:'), error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}
