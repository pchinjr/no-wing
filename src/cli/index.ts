#!/usr/bin/env node

/**
 * no-wing CLI - Guardian Angel for Amazon Q
 */

import { Command } from 'commander';
import chalk from 'chalk';

const program = new Command();

program
  .name('no-wing')
  .description('🛫 Guardian Angel for Amazon Q - Project-aware AI assistant for AWS serverless developers')
  .version('1.0.0');

// Configure Q with project context
program
  .command('configure')
  .description('🔧 Configure Q with your project context and AWS settings')
  .option('-p, --path <path>', 'Project path (defaults to current directory)')
  .action(async (options) => {
    const { configureCommand } = await import('./configure');
    await configureCommand(options);
  });

// Launch Q with project guidance
program
  .command('launch')
  .alias('q')
  .description('🚀 Launch Q with project-specific guidance and context')
  .action(async () => {
    const { launchCommand } = await import('./launch');
    await launchCommand();
  });

// Show project status and Q configuration
program
  .command('status')
  .description('📊 Show project analysis and Q configuration status')
  .action(async () => {
    const { statusCommand } = await import('./status');
    await statusCommand();
  });

// Quick setup (configure + launch)
program
  .command('setup')
  .description('⚡ Quick setup: configure and launch Q in one step')
  .option('-p, --path <path>', 'Project path (defaults to current directory)')
  .action(async (options) => {
    const { setupCommand } = await import('./setup');
    await setupCommand(options);
  });

// Help command
program
  .command('help')
  .description('❓ Show detailed help and usage examples')
  .action(() => {
    console.log(chalk.cyan('🛫 no-wing - Guardian Angel for Amazon Q'));
    console.log('');
    console.log(chalk.yellow('🎯 Purpose:'));
    console.log('Configure and launch Amazon Q with your AWS serverless project context.');
    console.log('Q will understand your project structure, AWS account, and commit authorship.');
    console.log('');
    console.log(chalk.yellow('🚀 Quick Start:'));
    console.log('  no-wing setup              # Configure and launch Q');
    console.log('  no-wing configure          # Configure Q with project context');
    console.log('  no-wing launch             # Launch Q with guidance');
    console.log('  no-wing status             # Show project and Q status');
    console.log('');
    console.log(chalk.yellow('💡 What Q will know about your project:'));
    console.log('  • Project type (SAM, CDK, Serverless Framework)');
    console.log('  • AWS account and region');
    console.log('  • Git repository and commit authorship');
    console.log('  • Existing Lambda functions and structure');
    console.log('  • SAM deployment configuration');
    console.log('');
    console.log(chalk.yellow('🛡️ Guardian Features:'));
    console.log('  • Project-aware Q responses');
    console.log('  • Proper commit authorship for Q changes');
    console.log('  • SAM deployment with your AWS settings');
    console.log('  • Context-aware Lambda function creation');
    console.log('');
    console.log(chalk.gray('Example workflow:'));
    console.log(chalk.gray('  cd my-sam-project'));
    console.log(chalk.gray('  no-wing setup'));
    console.log(chalk.gray('  # Q launches with full project context'));
    console.log(chalk.gray('  # Ask Q: "create a new Lambda function for user auth"'));
    console.log(chalk.gray('  # Q creates function, updates SAM template, commits with your authorship'));
  });

// Error handling
program.on('command:*', () => {
  console.error(chalk.red('❌ Invalid command: %s'), program.args.join(' '));
  console.log(chalk.gray('Run "no-wing help" for available commands'));
  process.exit(1);
});

// Parse command line arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  console.log(chalk.cyan('🛫 no-wing - Guardian Angel for Amazon Q'));
  console.log('');
  console.log(chalk.yellow('🚀 Quick Start:'));
  console.log('  no-wing setup              # Configure and launch Q with project context');
  console.log('  no-wing configure          # Configure Q for your project');
  console.log('  no-wing launch             # Launch Q with guidance');
  console.log('  no-wing status             # Show project status');
  console.log('');
  console.log(chalk.gray('Run "no-wing help" for detailed information'));
}
