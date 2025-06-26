/**
 * Launch command - Start Q with project guidance
 */

import chalk from 'chalk';
import { QGuardian } from '../services/QGuardian';

export async function launchCommand(): Promise<void> {
  console.log(chalk.cyan('🚀 Launching Q with project guidance'));
  console.log('====================================');
  console.log('');

  try {
    const guardian = new QGuardian();
    await guardian.launchQ();

  } catch (error) {
    if (error instanceof Error && error.message.includes('No Q configuration found')) {
      console.log(chalk.yellow('⚠️  Q Guardian not configured for this project'));
      console.log('');
      console.log(chalk.yellow('🔧 Please run one of these commands first:'));
      console.log('   no-wing configure    # Configure Q for this project');
      console.log('   no-wing setup        # Configure and launch in one step');
      console.log('');
    } else {
      console.error(chalk.red('❌ Error launching Q:'), error instanceof Error ? error.message : 'Unknown error');
    }
    process.exit(1);
  }
}
