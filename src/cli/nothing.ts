/**
 * Nothing Command - Jon Snow Easter Egg
 */

import chalk from 'chalk';

export async function nothingCommand() {
  console.log('');
  console.log(chalk.cyan('❄️  "You know nothing, Jon Snow."'));
  console.log('');
  console.log(chalk.gray('                    ⚔️'));
  console.log(chalk.gray('                 .-"```"-.'));
  console.log(chalk.gray('                /         \\'));
  console.log(chalk.gray('               |  o     o  |'));
  console.log(chalk.gray('               |     >     |'));
  console.log(chalk.gray('               |   \\___/   |'));
  console.log(chalk.gray('                \\  _____ /'));
  console.log(chalk.gray('                 `-._.-\''));
  console.log(chalk.gray('                   | |'));
  console.log(chalk.gray('                   |_|'));
  console.log('');
  console.log(chalk.yellow('🐺 Winter is coming... but Q has its own identity now.'));
  console.log('');
  console.log(chalk.gray('💡 Try these commands instead:'));
  console.log(chalk.gray('  no-wing setup    # Give Q its own identity'));
  console.log(chalk.gray('  no-wing status   # Check Q service account'));
  console.log(chalk.gray('  no-wing launch   # Launch Q with own identity'));
  console.log('');
}
