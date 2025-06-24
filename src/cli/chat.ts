/**
 * Developer chat interface with Q assistant
 */

import chalk from 'chalk';
import inquirer from 'inquirer';

export async function chatCommand(): Promise<void> {
  // Check if developer is set up
  const config = await loadDeveloperConfig();
  
  if (!config) {
    console.log(chalk.red('❌ No-wing not set up'));
    console.log(chalk.gray('Run "no-wing setup --token <your-token>" first'));
    return;
  }

  console.log(chalk.cyan('🛫 no-wing Q Assistant Chat'));
  console.log('============================');
  console.log('');
  console.log(chalk.gray(`Connected to Q Assistant: ${config.qId}`));
  console.log(chalk.gray(`Capability Level: ${config.qLevel}`));
  console.log('');
  console.log(chalk.yellow('💡 Tips:'));
  console.log('  • Ask Q to create AWS resources: "create a Lambda function for user auth"');
  console.log('  • Ask for analysis: "analyze my current Lambda functions"');
  console.log('  • Get help: "help" or "what can you do"');
  console.log('  • Exit chat: "exit", "quit", or Ctrl+C');
  console.log('');

  // Start chat loop
  await startChatLoop(config);
}

interface DeveloperConfig {
  developerId: string;
  qId: string;
  qLevel: string;
  region: string;
  setupDate: string;
}

async function loadDeveloperConfig(): Promise<DeveloperConfig | null> {
  try {
    const fs = require('fs');
    const path = require('path');
    const os = require('os');

    const configFile = path.join(os.homedir(), '.no-wing', 'config.json');
    
    if (!fs.existsSync(configFile)) {
      return null;
    }

    const configData = fs.readFileSync(configFile, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    return null;
  }
}

async function startChatLoop(config: DeveloperConfig): Promise<void> {
  console.log(chalk.cyan(`🤖 Q: Hello! I'm your AI development teammate.`));
  console.log(chalk.cyan(`     I'm currently at ${config.qLevel.toUpperCase()} level and ready to help!`));
  console.log('');

  while (true) {
    try {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'message',
          message: 'You:',
          prefix: ''
        }
      ]);

      const message = answers.message.trim();

      if (!message) {
        continue;
      }

      // Check for exit commands
      if (['exit', 'quit', 'bye', 'goodbye'].includes(message.toLowerCase())) {
        console.log(chalk.cyan('🤖 Q: Goodbye! It was great working with you.'));
        console.log(chalk.gray('     Run "no-wing chat" again anytime you need help!'));
        break;
      }

      // Process the message
      await processMessage(message, config);

    } catch (error) {
      if (error && typeof error === 'object' && 'name' in error && error.name === 'ExitPromptError') {
        // User pressed Ctrl+C
        console.log('');
        console.log(chalk.cyan('🤖 Q: Goodbye! Happy coding! 🛫'));
        break;
      }
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : 'Unknown error');
    }
  }
}

async function processMessage(message: string, config: DeveloperConfig): Promise<void> {
  const lowerMessage = message.toLowerCase();

  // Handle special commands
  if (lowerMessage === 'help' || lowerMessage === 'what can you do') {
    showHelp(config);
    return;
  }

  if (lowerMessage === 'status') {
    showStatus(config);
    return;
  }

  // Handle conversational messages
  if (isConversationalMessage(lowerMessage)) {
    handleConversation(lowerMessage);
    return;
  }

  // Handle task requests
  if (isTaskRequest(lowerMessage)) {
    await handleTaskRequest(message, config);
    return;
  }

  // Default response
  console.log(chalk.cyan('🤖 Q: I understand you want to chat! I\'m here to help with AWS development.'));
  console.log(chalk.gray('     Try asking me to create, analyze, or manage AWS resources.'));
  console.log('');
  console.log(chalk.gray('💡 Examples:'));
  console.log(chalk.gray('   • "create a Lambda function for data processing"'));
  console.log(chalk.gray('   • "analyze my current S3 buckets"'));
  console.log(chalk.gray('   • "help me set up a serverless API"'));
  console.log('');
}

function showHelp(config: DeveloperConfig): void {
  console.log(chalk.cyan('🤖 Q: I\'m your AI development teammate! Here\'s what I can help with:'));
  console.log('');
  console.log(chalk.yellow('🏗️ AWS Resource Creation:'));
  console.log(chalk.gray('   • Create Lambda functions with proper IAM roles'));
  console.log(chalk.gray('   • Set up S3 buckets with security best practices'));
  console.log(chalk.gray('   • Build serverless APIs with API Gateway'));
  console.log(chalk.gray('   • Configure DynamoDB tables and indexes'));
  console.log('');
  console.log(chalk.yellow('🔍 Analysis & Monitoring:'));
  console.log(chalk.gray('   • Analyze existing AWS resources'));
  console.log(chalk.gray('   • Review CloudWatch logs and metrics'));
  console.log(chalk.gray('   • Suggest performance optimizations'));
  console.log(chalk.gray('   • Identify security improvements'));
  console.log('');
  console.log(chalk.yellow('🛠️ Development Support:'));
  console.log(chalk.gray('   • Generate Infrastructure as Code (SAM templates)'));
  console.log(chalk.gray('   • Create deployment scripts'));
  console.log(chalk.gray('   • Set up CI/CD pipelines'));
  console.log(chalk.gray('   • Debug application issues'));
  console.log('');
  console.log(chalk.gray(`Current Capability Level: ${config.qLevel.toUpperCase()}`));
  
  if (config.qLevel === 'observer') {
    console.log(chalk.gray('   • I can read and analyze resources'));
    console.log(chalk.gray('   • I\'ll earn more capabilities as I complete tasks successfully'));
  } else if (config.qLevel === 'assistant') {
    console.log(chalk.gray('   • I can modify existing resources'));
    console.log(chalk.gray('   • I can create simple resources with approval'));
  } else if (config.qLevel === 'partner') {
    console.log(chalk.gray('   • I can create complex architectures'));
    console.log(chalk.gray('   • I have full development capabilities within boundaries'));
  }
  
  console.log('');
}

function showStatus(config: DeveloperConfig): void {
  console.log(chalk.cyan('🤖 Q: Here\'s my current status:'));
  console.log('');
  console.log(chalk.yellow('🤖 Q Identity:'));
  console.log(`   ID: ${chalk.cyan(config.qId)}`);
  console.log(`   Level: ${chalk.cyan(config.qLevel.toUpperCase())}`);
  console.log(`   Region: ${chalk.cyan(config.region)}`);
  console.log('');
  console.log(chalk.yellow('👤 Your Developer Profile:'));
  console.log(`   ID: ${chalk.cyan(config.developerId)}`);
  console.log(`   Setup Date: ${chalk.gray(new Date(config.setupDate).toLocaleDateString())}`);
  console.log('');
  console.log(chalk.gray('💡 All my activities are monitored for compliance and security'));
  console.log(chalk.gray('💡 I operate within permission boundaries set by your organization'));
  console.log('');
}

function isConversationalMessage(message: string): boolean {
  const conversationalPatterns = [
    /^(hi|hello|hey|greetings?)$/,
    /^(how are you|what's up|how's it going)$/,
    /^(thanks?|thank you|thx)$/,
    /^(bye|goodbye|see you|farewell)$/,
    /^(yes|no|ok|okay|sure|alright)$/
  ];

  return conversationalPatterns.some(pattern => pattern.test(message));
}

function isTaskRequest(message: string): boolean {
  const taskPatterns = [
    /^(create|build|make|generate|deploy|setup)/,
    /^(analyze|check|review|examine|inspect)/,
    /^(update|modify|change|configure|adjust)/,
    /^(delete|remove|cleanup|destroy)/,
    /^(list|show|display|get)/,
    /(lambda|function|api|bucket|database|queue)/,
    /(aws|cloud|infrastructure|deploy)/
  ];

  return taskPatterns.some(pattern => pattern.test(message));
}

function handleConversation(message: string): void {
  if (/^(hi|hello|hey|greetings?)$/.test(message)) {
    console.log(chalk.cyan('🤖 Q: Hello! Great to see you again. I\'m ready to help with your AWS development work.'));
    console.log(chalk.gray('     What would you like to build today?'));
  } else if (/^(how are you|what's up|how's it going)$/.test(message)) {
    console.log(chalk.cyan('🤖 Q: I\'m doing great! Ready to help you build amazing things on AWS.'));
    console.log(chalk.gray('     I\'ve been learning more about your organization\'s patterns and best practices.'));
  } else if (/^(thanks?|thank you|thx)$/.test(message)) {
    console.log(chalk.cyan('🤖 Q: You\'re very welcome! I\'m always happy to help.'));
    console.log(chalk.gray('     Let me know what else you\'d like to work on!'));
  } else {
    console.log(chalk.cyan('🤖 Q: I appreciate the conversation! I\'m here whenever you need AWS development help.'));
  }
  console.log('');
}

async function handleTaskRequest(message: string, config: DeveloperConfig): Promise<void> {
  console.log(chalk.cyan('🤖 Q: Let me help you with that task...'));
  console.log('');

  // Simulate task processing
  const taskSpinner = require('ora')('Analyzing your request...').start();
  
  // Simulate some processing time
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  taskSpinner.text = 'Checking permissions and capabilities...';
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  taskSpinner.text = 'Preparing AWS resources...';
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  taskSpinner.succeed('Task analysis complete');
  
  console.log('');
  console.log(chalk.cyan('🤖 Q: I\'ve analyzed your request. Here\'s what I can do:'));
  console.log('');
  
  // Simulate different responses based on capability level
  if (config.qLevel === 'observer') {
    console.log(chalk.yellow('📊 Analysis Results:'));
    console.log(chalk.gray('   • I can provide information and analysis'));
    console.log(chalk.gray('   • I cannot create resources at my current Observer level'));
    console.log(chalk.gray('   • I can suggest architecture patterns and best practices'));
    console.log('');
    console.log(chalk.cyan('🤖 Q: Would you like me to analyze existing resources or provide recommendations?'));
  } else if (config.qLevel === 'assistant') {
    console.log(chalk.yellow('🔧 Available Actions:'));
    console.log(chalk.gray('   • I can modify existing resources'));
    console.log(chalk.gray('   • I can create simple resources with approval'));
    console.log(chalk.gray('   • I can generate Infrastructure as Code templates'));
    console.log('');
    console.log(chalk.cyan('🤖 Q: I can help implement this with proper approval workflows.'));
  } else if (config.qLevel === 'partner') {
    console.log(chalk.yellow('🚀 Full Implementation Available:'));
    console.log(chalk.gray('   • I can create the complete solution'));
    console.log(chalk.gray('   • I\'ll generate working code and infrastructure'));
    console.log(chalk.gray('   • I\'ll set up monitoring and best practices'));
    console.log('');
    console.log(chalk.cyan('🤖 Q: I can implement this solution right away within my permission boundaries.'));
  }
  
  console.log('');
  console.log(chalk.gray('💡 All my actions are logged and monitored for compliance'));
  console.log('');
}
