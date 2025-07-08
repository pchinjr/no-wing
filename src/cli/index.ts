#!/usr/bin/env node

/**
 * no-wing CLI - Q Service Account Manager
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

// Read version from package.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJson = JSON.parse(readFileSync(path.join(__dirname, '../../package.json'), 'utf8'));

const program = new Command();

program
  .name('no-wing')
  .description('🛫 Q Service Account Manager - Give Amazon Q its own identity')
  .version(packageJson.version);

// Setup Q service account for current project
program
  .command('setup')
  .description('🔧 Create Q service account for current project')
  .option('--dry-run', 'Show what would be created without making changes')
  .option('--force', 'Recreate service account if it already exists')
  .action(async (options) => {
    const { setupCommand } = await import('./setup.js');
    await setupCommand(options);
  });

// Show Q service account status
program
  .command('status')
  .description('📊 Show Q service account status and health')
  .option('--verbose', 'Show detailed service account information')
  .action(async (options) => {
    const { statusCommand } = await import('./status.js');
    await statusCommand(options);
  });

// Manage Q service account permissions
program
  .command('permissions')
  .description('🔐 Manage Q service account permissions')
  .option('--list', 'List current permissions')
  .option('--add <permission>', 'Add permission to Q service account')
  .option('--remove <permission>', 'Remove permission from Q service account')
  .action(async (options) => {
    const { permissionsCommand } = await import('./permissions.js');
    await permissionsCommand(options);
  });

// Show Q service account audit log
program
  .command('audit')
  .description('📋 Show Q service account activity log')
  .option('--since <date>', 'Show activity since date (e.g., "1 day ago")')
  .option('--type <type>', 'Filter by action type (git, aws, file)')
  .action(async (options) => {
    const { auditCommand } = await import('./audit.js');
    await auditCommand(options);
  });

// Clean up Q service account
program
  .command('cleanup')
  .description('🧹 Remove Q service account and all associated resources')
  .option('--keep-logs', 'Keep audit logs after cleanup')
  .option('--force', 'Skip confirmation prompts')
  .action(async (options) => {
    const { cleanupCommand } = await import('./cleanup.js');
    await cleanupCommand(options);
  });

// Launch Q with service account identity
program
  .command('launch')
  .alias('q')
  .description('🚀 Launch Amazon Q with service account identity')
  .action(async () => {
    const { launchCommand } = await import('./launch.js');
    await launchCommand();
  });

// Easter egg: Jon Snow knows nothing
program
  .command('nothing')
  .description('❄️ You know nothing...')
  .action(async () => {
    const { nothingCommand } = await import('./nothing.js');
    await nothingCommand();
  });

// Help command
program
  .command('help')
  .description('❓ Show detailed help and usage examples')
  .action(() => {
    console.log(chalk.cyan('🛫 no-wing - Q Service Account Manager'));
    console.log('');
    console.log(chalk.yellow('🎯 Purpose:'));
    console.log('Give Amazon Q its own identity with dedicated local user, git identity, and AWS credentials.');
    console.log('Q operates as a service account - never masquerading as you again.');
    console.log('');
    console.log(chalk.yellow('🚀 Quick Start:'));
    console.log('  no-wing setup              # Create Q service account for current project');
    console.log('  no-wing status             # Check Q service account health');
    console.log('  no-wing launch             # Launch Q with service account identity');
    console.log('  no-wing audit              # View Q\'s recent actions');
    console.log('  no-wing cleanup            # Remove Q service account');
    console.log('');
    console.log(chalk.yellow('🛡️ What no-wing creates:'));
    console.log('  • Local user: q-assistant-{project}');
    console.log('  • Git identity: "Q Assistant ({project})"');
    console.log('  • AWS profile: q-assistant-{project}');
    console.log('  • Isolated workspace and permissions');
    console.log('');
    console.log(chalk.yellow('🔐 Security Benefits:'));
    console.log('  • Q commits with its own git identity');
    console.log('  • Q uses its own AWS credentials');
    console.log('  • Clear audit trail of Q vs human actions');
    console.log('  • Isolated blast radius per project');
    console.log('');
    console.log(chalk.gray('Example workflow:'));
    console.log(chalk.gray('  cd my-sam-project'));
    console.log(chalk.gray('  no-wing setup'));
    console.log(chalk.gray('  no-wing launch'));
    console.log(chalk.gray('  # Q operates with its own identity'));
    console.log(chalk.gray('  # Q commits show "Q Assistant" as author'));
    console.log(chalk.gray('  # Q deploys with its own AWS credentials'));
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
  console.log(chalk.cyan('🛫 no-wing - Q Service Account Manager'));
  console.log('');
  console.log(chalk.yellow('🚀 Quick Start:'));
  console.log('  no-wing setup              # Create Q service account for current project');
  console.log('  no-wing status             # Check service account status');
  console.log('  no-wing launch             # Launch Q with service account identity');
  console.log('');
  console.log(chalk.gray('Run "no-wing help" for detailed information'));
  console.log(chalk.gray('See MVP_ROADMAP.md for implementation progress'));
}
