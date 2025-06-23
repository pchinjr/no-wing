#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './init';
import { nothingCommand } from './nothing';

const program = new Command();

program
  .name('no-wing')
  .description('🛫 Autonomous Developer Onboarding System - No wings required')
  .version('0.1.0');

// Main init command
program
  .command('init')
  .description('Initialize a new developer + Q pairing with AWS resources')
  .option('--name <name>', 'Developer name')
  .option('--repo <repo>', 'GitHub repository (owner/repo)')
  .option('--env <env>', 'Environment (dev, staging, prod)', 'dev')
  .option('--region <region>', 'AWS region', 'us-east-1')
  .action(initCommand);

// Easter egg command
program
  .command('nothing')
  .description('🥚 You know nothing...')
  .action(nothingCommand);

// Handle unknown commands
program.on('command:*', () => {
  console.error(chalk.red(`Invalid command: ${program.args.join(' ')}`));
  console.log(chalk.yellow('Run "no-wing --help" for available commands'));
  process.exit(1);
});

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

program.parse();
