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
    
    if (trimmedMessage === 'status' || trimmedMessage === 'help') {
      await this.showStatus();
      return;
    }
    
    if (trimmedMessage === 'clear') {
      console.clear();
      await this.displayWelcome();
      return;
    }

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
        
      } else {
        console.log(chalk.red(`🤖 Q: I encountered an issue while working on that.`));
        console.log(chalk.yellow(`     But don't worry, I'm learning from this experience!`));
      }
      
    } catch (error) {
      console.log(chalk.red(`🤖 Q: I ran into a problem: ${error instanceof Error ? error.message : 'Unknown error'}`));
      console.log(chalk.yellow(`     I'm still learning, so let's try something else!`));
    }
    
    console.log('');
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
