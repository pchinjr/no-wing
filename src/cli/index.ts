#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './init';
import { nothingCommand } from './nothing';
import { verifyCommand, approveCommand, denyCommand } from './verify';

const program = new Command();

program
  .name('no-wing')
  .description('🛫 Autonomous Developer Onboarding System - No wings required')
  .version('0.1.0');

// Main init command
program
  .command('init')
  .description('Initialize a new developer + Q pairing with AWS resources')
  .option('--name <n>', 'Developer name')
  .option('--repo <repo>', 'GitHub repository (owner/repo)')
  .option('--env <env>', 'Environment (dev, staging, prod)', 'dev')
  .option('--region <region>', 'AWS region', 'us-east-1')
  .action(initCommand);

// Q verification commands
program
  .command('verify')
  .description('🔍 Verify Q\'s operations and commits')
  .option('--all', 'Show all pending verifications')
  .option('--commit <hash>', 'Verify specific commit')
  .option('--request <id>', 'Verify specific permission request')
  .argument('[commits...]', 'Commit hashes to verify')
  .action(verifyCommand);

program
  .command('approve')
  .description('✅ Approve Q\'s permission request')
  .argument('<requestId>', 'Request ID to approve')
  .action(approveCommand);

program
  .command('deny')
  .description('❌ Deny Q\'s permission request')
  .argument('<requestId>', 'Request ID to deny')
  .action(denyCommand);

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
