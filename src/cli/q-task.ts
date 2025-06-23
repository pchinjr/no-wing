/**
 * Q Task CLI Command
 * 
 * Handles Q task execution and status commands for the MVP demo
 */

import chalk from 'chalk';
import { QTaskExecutor } from '../q/task-executor';
import { QIdentityManager } from '../q/identity';

export async function qTaskCommand(taskDescription: string, options: any = {}) {
  console.log(chalk.blue('🛫 no-wing Q Task Executor'));
  console.log(chalk.gray('================================'));
  console.log('');

  if (!taskDescription) {
    console.log(chalk.red('❌ Task description is required'));
    console.log(chalk.yellow('Example: no-wing q-task "analyze the Lambda function logs"'));
    return;
  }

  const executor = new QTaskExecutor();
  
  try {
    const result = await executor.executeTask(taskDescription);
    
    if (result.success) {
      console.log('');
      console.log(chalk.green('📋 Task Result:'));
      console.log(chalk.gray('---------------'));
      
      if (result.data) {
        console.log(JSON.stringify(result.data, null, 2));
      }
      
      if (result.qAdvanced) {
        console.log('');
        console.log(chalk.magenta('🎉 Q HAS ADVANCED TO A NEW CAPABILITY LEVEL!'));
        console.log(chalk.magenta('Run "no-wing q-status" to see Q\'s new abilities'));
      }
    } else {
      console.log('');
      console.log(chalk.red('❌ Task Failed:'));
      console.log(chalk.red(result.error || 'Unknown error'));
      
      if (result.error?.includes('insufficient')) {
        console.log('');
        console.log(chalk.yellow('💡 Tip: Try simpler tasks to help Q advance to higher levels'));
        console.log(chalk.yellow('Observer tasks: "analyze logs", "read function info"'));
        console.log(chalk.yellow('Assistant tasks: "update configuration", "modify settings"'));
        console.log(chalk.yellow('Partner tasks: "create new function", "build feature"'));
      }
    }
  } catch (error) {
    console.log(chalk.red('💥 Unexpected error:'));
    console.log(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
  }
  
  console.log('');
}

export async function qStatusCommand(options: any = {}) {
  console.log(chalk.blue('🛫 no-wing Q Status'));
  console.log(chalk.gray('==================='));
  console.log('');

  const executor = new QTaskExecutor();
  
  try {
    const status = await executor.getQStatus();
    
    if (status.error) {
      console.log(chalk.red('❌ ' + status.error));
      console.log(chalk.yellow('💡 Run "no-wing init" to create Q\'s identity'));
      return;
    }

    // Display Q's current status
    console.log(chalk.cyan('🤖 Q Identity:'));
    console.log(`   Name: ${status.name}`);
    console.log(`   ID: ${status.id}`);
    console.log('');
    
    console.log(chalk.cyan('📊 Capability Level:'));
    console.log(`   Current: ${chalk.bold(status.level.toUpperCase())}`);
    console.log(`   Next Level: ${status.nextLevelRequirement}`);
    console.log('');
    
    console.log(chalk.cyan('📈 Performance:'));
    console.log(`   Successful Tasks: ${chalk.green(status.successfulTasks)}`);
    console.log(`   Failed Tasks: ${chalk.red(status.failedTasks)}`);
    console.log(`   Success Rate: ${getSuccessRate(status.successfulTasks, status.failedTasks)}%`);
    console.log('');
    
    console.log(chalk.cyan('🔐 Permissions:'));
    console.log(`   AWS Permissions: ${status.permissions}`);
    console.log(`   Last Active: ${new Date(status.lastActive).toLocaleString()}`);
    console.log('');
    
    // Show available task examples based on current level
    console.log(chalk.cyan('💡 Available Task Examples:'));
    showTaskExamples(status.level);
    
  } catch (error) {
    console.log(chalk.red('💥 Error getting Q status:'));
    console.log(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
  }
  
  console.log('');
}

function getSuccessRate(successful: number, failed: number): string {
  const total = successful + failed;
  if (total === 0) return '0';
  return ((successful / total) * 100).toFixed(1);
}

function showTaskExamples(level: string) {
  const examples = {
    observer: [
      '"analyze the Lambda function logs"',
      '"read function configuration info"',
      '"check function performance metrics"'
    ],
    assistant: [
      '"update the Lambda function timeout"',
      '"modify the function memory allocation"',
      '"configure environment variables"'
    ],
    partner: [
      '"create a new user authentication function"',
      '"build a data processing pipeline"',
      '"design a microservice architecture"'
    ]
  };

  // Show current level examples
  const currentExamples = examples[level as keyof typeof examples] || examples.observer;
  console.log(chalk.green(`   ${level.toUpperCase()} Level Tasks:`));
  currentExamples.forEach(example => {
    console.log(chalk.gray(`   • no-wing q-task ${example}`));
  });

  // Show next level preview if not at max
  if (level !== 'partner') {
    const nextLevel = level === 'observer' ? 'assistant' : 'partner';
    const nextExamples = examples[nextLevel as keyof typeof examples];
    console.log('');
    console.log(chalk.yellow(`   ${nextLevel.toUpperCase()} Level Tasks (locked):`));
    nextExamples.forEach(example => {
      console.log(chalk.gray(`   🔒 no-wing q-task ${example}`));
    });
  }
}
