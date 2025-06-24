/**
 * Q Task CLI Command
 * 
 * Handles Q task execution and status commands with real AWS integration
 */

import chalk from 'chalk';
import { QTaskExecutor } from '../q/task-executor';
import { QIdentityManager } from '../q/identity';

/**
 * Execute a Q task
 */
export async function qTaskCommand(taskDescription: string): Promise<void> {
  console.log(chalk.blue('🛫 no-wing Q Task Executor'));
  console.log(chalk.blue('================================'));
  console.log('');

  if (!taskDescription || taskDescription.trim().length === 0) {
    console.log(chalk.red('❌ Please provide a task description'));
    console.log(chalk.yellow('Example: no-wing q-task "create a new Lambda function"'));
    return;
  }

  // Load Q's identity
  const qIdentityManager = new QIdentityManager();
  const qIdentity = await qIdentityManager.loadIdentity();
  
  if (!qIdentity) {
    console.error(chalk.red('❌ Q identity not found. Run "no-wing init" first.'));
    process.exit(1);
  }

  const executor = new QTaskExecutor(qIdentity);
  
  try {
    const result = await executor.executeTask(taskDescription);
    
    if (result.success) {
      console.log('');
      console.log(chalk.green('📋 Task Result:'));
      console.log(chalk.gray('---------------'));
      
      if (result.details) {
        console.log(JSON.stringify(result.details, null, 2));
      }
      
      if (result.awsResources && result.awsResources.length > 0) {
        console.log('');
        console.log(chalk.blue('🔧 AWS Resources Created/Modified:'));
        result.awsResources.forEach(resource => {
          console.log(chalk.gray(`  • ${resource.type}: ${resource.name} (${resource.status})`));
        });
      }
      
      if (result.gitCommit) {
        console.log('');
        console.log(chalk.green(`📝 Q documented work in Git commit: ${result.gitCommit.substring(0, 8)}`));
      }
    } else {
      console.log('');
      console.log(chalk.red('❌ Task Failed:'));
      console.log(chalk.red(result.summary || 'Unknown error'));
      
      if (result.summary?.includes('insufficient')) {
        console.log('');
        console.log(chalk.yellow('💡 Tip: Try simpler tasks to help Q advance to higher levels'));
        console.log(chalk.yellow('Observer tasks: "analyze logs", "read function info"'));
        console.log(chalk.yellow('Assistant tasks: "update configuration", "modify settings"'));
        console.log(chalk.yellow('Partner tasks: "create new function", "build feature"'));
      }
    }
  } catch (error) {
    console.error(chalk.red('❌ Error executing task:'), error);
    process.exit(1);
  }
}

/**
 * Show Q's current status
 */
export async function qStatusCommand(): Promise<void> {
  console.log(chalk.blue('🛫 no-wing Q Status'));
  console.log(chalk.gray('==================='));
  console.log('');

  // Load Q's identity
  const qIdentityManager = new QIdentityManager();
  const qIdentity = await qIdentityManager.loadIdentity();
  
  if (!qIdentity) {
    console.log(chalk.red('❌ Q identity not found'));
    console.log(chalk.yellow('💡 Run "no-wing init" to create Q\'s identity'));
    return;
  }

  // Display Q's current status
  console.log(chalk.cyan('🤖 Q Identity:'));
  console.log(`   Name: ${qIdentity.name}`);
  console.log(`   ID: ${qIdentity.id}`);
  console.log('');
  
  console.log(chalk.cyan('📊 Capability Level:'));
  console.log(`   Current: ${chalk.bold(qIdentity.level.toUpperCase())}`);
  console.log(`   Next Level: ${getNextLevelRequirement(qIdentity.level)}`);
  console.log('');
  
  console.log(chalk.cyan('📈 Performance:'));
  console.log(`   Successful Tasks: ${chalk.green(qIdentity.successfulTasks)}`);
  console.log(`   Failed Tasks: ${chalk.red(qIdentity.failedTasks)}`);
  console.log(`   Success Rate: ${getSuccessRate(qIdentity.successfulTasks, qIdentity.failedTasks)}%`);
  console.log('');
  
  console.log(chalk.cyan('🔐 Permissions:'));
  console.log(`   AWS Permissions: ${qIdentity.permissions?.length || 0}`);
  console.log(`   Last Active: ${new Date(qIdentity.lastActive).toLocaleString()}`);
  console.log('');
  
  // Show available task examples based on current level
  console.log(chalk.cyan('💡 Available Task Examples:'));
  showTaskExamples(qIdentity.level);
  
  console.log('');
}

/**
 * Show task examples for the current level
 */
function showTaskExamples(level: string) {
  const examples = {
    observer: [
      '"analyze system performance"',
      '"check function logs"',
      '"review configuration"'
    ],
    assistant: [
      '"update function memory"',
      '"modify timeout settings"',
      '"configure environment variables"'
    ],
    partner: [
      '"create a new user authentication function"',
      '"build a data processing pipeline"',
      '"design a microservice architecture"'
    ]
  };

  const currentExamples = examples[level as keyof typeof examples] || examples.observer;
  console.log(chalk.green(`   ${level.toUpperCase()} Level Tasks:`));
  currentExamples.forEach(example => {
    console.log(chalk.green(`   • no-wing q-task ${example}`));
  });

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

/**
 * Get next level requirement text
 */
function getNextLevelRequirement(currentLevel: string): string {
  switch (currentLevel.toLowerCase()) {
    case 'observer':
      return 'Assistant (5 successful tasks)';
    case 'assistant':
      return 'Partner (15 successful tasks)';
    case 'partner':
      return 'Maximum level reached';
    default:
      return 'Unknown';
  }
}

/**
 * Calculate success rate percentage
 */
function getSuccessRate(successful: number, failed: number): string {
  const total = successful + failed;
  if (total === 0) return '0.0';
  return ((successful / total) * 100).toFixed(1);
}
