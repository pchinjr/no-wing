import inquirer from 'inquirer';
import chalk from 'chalk';
import { QIdentityManager, QCapabilityLevel } from '../q/identity';
import { QTaskExecutor } from '../q/task-executor';

interface ChatSession {
  active: boolean;
  qIdentity: any;
  messageCount: number;
}

export class QChatInterface {
  private identityManager: QIdentityManager;
  private taskExecutor: QTaskExecutor | null = null;
  private session: ChatSession;

  constructor() {
    this.identityManager = new QIdentityManager();
    
    this.session = {
      active: false,
      qIdentity: null,
      messageCount: 0
    };
  }

  async startChat(): Promise<void> {
    await this.initializeSession();
    await this.displayWelcome();
    await this.chatLoop();
  }

  private async initializeSession(): Promise<void> {
    let qIdentity = await this.identityManager.loadIdentity();
    
    if (!qIdentity) {
      console.log(chalk.yellow('🤖 Q: Hi! I don\'t have an identity yet. Let me create one...'));
      qIdentity = await this.identityManager.createIdentity('Q');
      console.log(chalk.green('✅ Q identity created successfully!'));
    }

    this.session.qIdentity = qIdentity;
    this.taskExecutor = new QTaskExecutor(qIdentity);
    this.session.active = true;
  }

  private async displayWelcome(): Promise<void> {
    const { qIdentity } = this.session;
    
    console.clear();
    console.log(chalk.blue.bold('🛫 no-wing Interactive Q Chat'));
    console.log(chalk.gray('================================'));
    console.log('');
    
    console.log(chalk.cyan(`🤖 Q: Hello! I'm Q, your AI development teammate.`));
    console.log(chalk.cyan(`     I'm currently at ${qIdentity.level.toUpperCase()} level with ${qIdentity.successfulTasks} successful tasks.`));
    console.log('');
    
    console.log(chalk.gray('💡 Tips:'));
    console.log(chalk.gray('   • Ask me to create AWS resources: "create a Lambda function for user auth"'));
    console.log(chalk.gray('   • Ask for analysis: "analyze my current Lambda functions"'));
    console.log(chalk.gray('   • Check my status: "status" or "help"'));
    console.log(chalk.gray('   • Exit chat: "exit", "quit", or Ctrl+C'));
    console.log('');
  }

  private async chatLoop(): Promise<void> {
    while (this.session.active) {
      try {
        const { message } = await inquirer.prompt([
          {
            type: 'input',
            name: 'message',
            message: chalk.blue('You:'),
            prefix: ''
          }
        ]);

        if (this.isExitCommand(message)) {
          await this.exitChat();
          break;
        }

        await this.processMessage(message);
        this.session.messageCount++;
        
      } catch (error) {
        if ((error as any).name === 'ExitPromptError') {
          await this.exitChat();
          break;
        }
        console.error(chalk.red('❌ Chat error:'), error);
      }
    }
  }

  private isExitCommand(message: string): boolean {
    const exitCommands = ['exit', 'quit', 'bye', 'goodbye'];
    return exitCommands.includes(message.toLowerCase().trim());
  }

  private async processMessage(message: string): Promise<void> {
    const trimmedMessage = message.trim().toLowerCase();
    
    // Handle special commands
    if (trimmedMessage === 'status' || trimmedMessage === 'help') {
      await this.showStatus();
      return;
    }
    
    if (trimmedMessage === 'clear') {
      console.clear();
      await this.displayWelcome();
      return;
    }

    // Handle conversational messages
    if (this.isConversationalMessage(trimmedMessage)) {
      await this.handleConversation(trimmedMessage);
      return;
    }

    // Handle task requests
    if (this.isTaskRequest(trimmedMessage)) {
      await this.handleTaskRequest(message);
      return;
    }

    // Default: treat as casual conversation
    await this.handleConversation(trimmedMessage);
  }

  private isConversationalMessage(message: string): boolean {
    const conversationalPatterns = [
      /^(hi|hello|hey|greetings?)$/,
      /^(how are you|what's up|how's it going)$/,
      /^(thanks?|thank you|thx)$/,
      /^(bye|goodbye|see you|farewell)$/,
      /^(yes|no|ok|okay|sure|alright)$/,
      /^(what|who|when|where|why|how)\s/,
      /^(tell me about|explain|describe)/,
      /^(can you|are you|do you|will you)/
    ];

    return conversationalPatterns.some(pattern => pattern.test(message));
  }

  private isTaskRequest(message: string): boolean {
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

  private async handleConversation(message: string): Promise<void> {
    const responses = this.getConversationalResponse(message);
    
    console.log(chalk.cyan(`🤖 Q: ${responses.main}`));
    
    if (responses.tip) {
      console.log(chalk.gray(`     ${responses.tip}`));
    }
    
    if (responses.examples && responses.examples.length > 0) {
      console.log('');
      console.log(chalk.gray('💡 Try asking me to:'));
      responses.examples.forEach(example => {
        console.log(chalk.gray(`   • ${example}`));
      });
    }
  }

  private getConversationalResponse(message: string): {
    main: string;
    tip?: string;
    examples?: string[];
  } {
    // Greetings
    if (/^(hi|hello|hey|greetings?)$/.test(message)) {
      return {
        main: "Hello! Great to chat with you again. I'm ready to help with your AWS infrastructure.",
        examples: [
          "create a Lambda function for user authentication",
          "analyze my current S3 buckets",
          "build a data processing pipeline"
        ]
      };
    }

    // How are you / status
    if (/^(how are you|what's up|how's it going)$/.test(message)) {
      return {
        main: `I'm doing well! I'm currently at ${this.session.qIdentity?.level || 'OBSERVER'} level with ${this.session.qIdentity?.successfulTasks || 0} successful tasks.`,
        tip: "I'm ready to help you build and manage AWS infrastructure.",
        examples: [
          "create a new Lambda function",
          "check my current AWS resources"
        ]
      };
    }

    // Thanks
    if (/^(thanks?|thank you|thx)$/.test(message)) {
      return {
        main: "You're welcome! I'm always happy to help with your AWS development work.",
        tip: "Just let me know what you'd like to build next!"
      };
    }

    // Goodbye
    if (/^(bye|goodbye|see you|farewell)$/.test(message)) {
      return {
        main: "Goodbye! It was great working with you. I'll be here whenever you need me.",
        tip: "Just run 'no-wing chat' again when you want to continue building!"
      };
    }

    // Questions about Q
    if (/^(what|who|tell me about|explain|describe)/.test(message) && 
        /(you|q|yourself|capabilities|what you do)/.test(message)) {
      return {
        main: "I'm Q, your AI development teammate! I help you build AWS infrastructure using natural language.",
        tip: "I can create Lambda functions, S3 buckets, APIs, and more - all with proper Infrastructure as Code.",
        examples: [
          "create a serverless API",
          "build a data storage solution",
          "analyze my current infrastructure"
        ]
      };
    }

    // Capabilities questions
    if (/^(can you|are you able|do you)/.test(message)) {
      return {
        main: "I can help you build and manage AWS infrastructure! I create real resources with proper SAM templates.",
        examples: [
          "create Lambda functions with API Gateway",
          "set up S3 buckets with proper security",
          "analyze and optimize existing resources",
          "build complete serverless applications"
        ]
      };
    }

    // Default conversational response
    return {
      main: "I understand you want to chat! I'm here to help you build AWS infrastructure.",
      tip: "Try asking me to create, analyze, or manage AWS resources.",
      examples: [
        "create a Lambda function for data processing",
        "analyze my current Lambda functions",
        "build a serverless API"
      ]
    };
  }

  private async handleTaskRequest(message: string): Promise<void> {
    console.log(chalk.cyan(`🤖 Q: Let me work on that for you...`));
    console.log('');
    
    try {
      if (!this.taskExecutor) {
        console.log(chalk.red('🤖 Q: I\'m not properly initialized yet. Please try again.'));
        return;
      }
      
      const result = await this.taskExecutor.executeTask(message);
      
      if (result.success) {
        console.log(chalk.green(`🤖 Q: Task completed successfully! 🎉`));
        
        if (result.awsResources && result.awsResources.length > 0) {
          console.log(chalk.cyan(`     I created ${result.awsResources.length} AWS resource(s):`));
          result.awsResources.forEach(resource => {
            console.log(chalk.gray(`     • ${resource.type}: ${resource.name}`));
          });
        }
        
        if (result.gitCommit) {
          console.log(chalk.cyan(`     I documented the work in Git commit: ${result.gitCommit.substring(0, 8)}`));
        }
        
        if (result.generatedProject) {
          console.log(chalk.cyan(`     📁 Generated project at: ${result.generatedProject.path}`));
        }
      } else {
        console.log(chalk.yellow(`🤖 Q: ${result.error || 'I ran into a problem with that task.'}`));
        console.log(chalk.gray(`     ${result.suggestion || 'Let\'s try something else!'}`));
      }
    } catch (error) {
      console.log(chalk.red(`🤖 Q: I encountered an error: ${error}`));
      console.log(chalk.gray('     Please try again or ask for help.'));
    }
  }

  private async showStatus(): Promise<void> {
    const qIdentity = await this.identityManager.loadIdentity();
    if (!qIdentity) return;
    
    console.log(chalk.cyan('🤖 Q: Here\'s my current status:'));
    console.log('');
    console.log(chalk.gray(`   Identity: ${qIdentity.name} (${qIdentity.id})`));
    console.log(chalk.gray(`   Level: ${qIdentity.level.toUpperCase()}`));
    console.log(chalk.gray(`   Successful Tasks: ${qIdentity.successfulTasks}`));
    console.log(chalk.gray(`   Failed Tasks: ${qIdentity.failedTasks}`));
    const successRate = qIdentity.successfulTasks + qIdentity.failedTasks > 0 ? 
      ((qIdentity.successfulTasks / (qIdentity.successfulTasks + qIdentity.failedTasks)) * 100).toFixed(1) : 0;
    console.log(chalk.gray(`   Success Rate: ${successRate}%`));
    console.log(chalk.gray(`   Last Active: ${new Date(qIdentity.lastActive).toLocaleString()}`));
    console.log('');
  }

  private async exitChat(): Promise<void> {
    const { messageCount } = this.session;
    
    console.log('');
    console.log(chalk.cyan(`🤖 Q: Thanks for the chat! We exchanged ${messageCount} messages.`));
    console.log(chalk.cyan(`     I'm always here when you need me. Just run 'no-wing chat' again!`));
    console.log('');
    console.log(chalk.blue('🛫 Happy coding! No wings needed.'));
    
    this.session.active = false;
  }
}

export async function chatCommand(): Promise<void> {
  const chatInterface = new QChatInterface();
  await chatInterface.startChat();
}
