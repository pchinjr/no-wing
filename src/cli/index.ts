#!/usr/bin/env node

/**
 * no-wing CLI - Enterprise Developer+Q Vending and Onboarding System
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { adminCommand } from './admin';
import { setupCommand } from './setup';
import { chatCommand } from './chat';

const program = new Command();

program
  .name('no-wing')
  .description('🛫 Enterprise Developer+Q Vending and Onboarding System')
  .version('1.0.0');

// Admin commands for provisioning and monitoring
const adminCmd = program
  .command('admin')
  .description('👨‍💼 Admin commands for managing developer+Q pairs');

// Provision developer+Q pair
adminCmd
  .command('provision-developer')
  .description('🏭 Provision a new developer+Q pair')
  .option('-e, --email <email>', 'Developer email address')
  .option('-r, --role <role>', 'Developer role (junior|senior|contractor|intern)')
  .option('-t, --team <team>', 'Team name')
  .option('-p, --projects <projects>', 'Comma-separated list of projects')
  .option('-b, --budget <budget>', 'Monthly budget limit in USD')
  .option('--duration <duration>', 'Duration for contractors/interns')
  .action(async (options) => {
    const { provisionDeveloper } = await import('./admin');
    await provisionDeveloper(options);
  });

// Dashboard
adminCmd
  .command('dashboard')
  .description('📊 View monitoring dashboard')
  .action(async () => {
    const { showDashboard } = await import('./admin');
    await showDashboard();
  });

// Monitor specific Q
adminCmd
  .command('monitor')
  .description('🔍 Monitor specific Q agent')
  .argument('<qId>', 'Q agent ID to monitor')
  .option('--days <days>', 'Number of days to look back', '7')
  .action(async (qId, options) => {
    const { monitorQ } = await import('./admin');
    await monitorQ(qId, options);
  });

// Developer setup command
program
  .command('setup')
  .description('🚀 Set up your developer environment with Q assistant')
  .option('-t, --token <token>', 'Onboarding token provided by admin')
  .action((options) => {
    setupCommand(options);
  });

// Developer chat with Q
program
  .command('chat')
  .description('💬 Start interactive chat with your Q assistant')
  .action(() => {
    chatCommand();
  });

// Help command
program
  .command('help')
  .description('❓ Show help information')
  .action(() => {
    console.log(chalk.cyan('🛫 no-wing - Enterprise Developer+Q Vending System'));
    console.log('');
    console.log(chalk.yellow('For Administrators:'));
    console.log('  no-wing admin provision-developer  Provision new developer+Q pair');
    console.log('  no-wing admin dashboard           View monitoring dashboard');
    console.log('  no-wing admin monitor <qId>       Monitor specific Q agent');
    console.log('');
    console.log(chalk.yellow('For Developers:'));
    console.log('  no-wing setup --token <token>     Complete onboarding setup');
    console.log('  no-wing chat                      Chat with your Q assistant');
    console.log('');
    console.log(chalk.gray('Documentation: https://github.com/your-org/no-wing'));
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
  console.log(chalk.cyan('🛫 no-wing - Enterprise Developer+Q Vending System'));
  console.log('');
  console.log(chalk.yellow('Quick Start:'));
  console.log('');
  console.log(chalk.gray('Administrators:'));
  console.log('  no-wing admin provision-developer --email sarah@company.com --role junior');
  console.log('');
  console.log(chalk.gray('Developers:'));
  console.log('  no-wing setup --token <your-onboarding-token>');
  console.log('  no-wing chat');
  console.log('');
  console.log(chalk.gray('Run "no-wing help" for all commands'));
}
