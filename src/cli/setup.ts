/**
 * Setup command - Configure and launch Q in one step
 */

import chalk from 'chalk';
import { configureCommand } from './configure';
import { launchCommand } from './launch';

export async function setupCommand(options: { path?: string }): Promise<void> {
  console.log(chalk.cyan('⚡ Quick Setup: Configuring and launching Q Guardian'));
  console.log('===================================================');
  console.log('');

  try {
    // Step 1: Configure
    await configureCommand(options);
    
    console.log(chalk.green('🎯 Configuration complete! Launching Q...'));
    console.log('');
    
    // Step 2: Launch
    await launchCommand();

  } catch (error) {
    console.error(chalk.red('❌ Setup failed:'), error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}
