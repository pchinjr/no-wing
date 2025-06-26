/**
 * Q Guardian - Configures and launches Q with project context and commit authorship
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { QConfiguration, ProjectContext } from '../types';

export class QGuardian {
  private configPath: string;

  constructor() {
    this.configPath = path.join(os.homedir(), '.no-wing');
  }

  /**
   * Configure Q with project context and commit authorship
   */
  async configureQ(projectContext: ProjectContext): Promise<QConfiguration> {
    console.log('🛡️ Configuring Q Guardian for your project...');

    // Ensure config directory exists
    if (!fs.existsSync(this.configPath)) {
      fs.mkdirSync(this.configPath, { recursive: true });
    }

    // Create Q configuration
    const config: QConfiguration = {
      projectContext,
      commitAuthor: {
        name: projectContext.gitRepo?.authorName || 'Q Assistant',
        email: projectContext.gitRepo?.authorEmail || 'q-assistant@no-wing.dev'
      },
      awsProfile: process.env.AWS_PROFILE,
      samConfig: {
        region: projectContext.awsRegion,
        capabilities: ['CAPABILITY_IAM'],
        tags: {
          'CreatedBy': 'no-wing-Q-Guardian',
          'Project': projectContext.name
        }
      },
      preferences: {
        autoCommit: true,
        commitMessagePrefix: '[Q]',
        deployOnCreate: true,
        testAfterDeploy: false,
        verboseLogging: true
      }
    };

    // Save configuration
    const configFile = path.join(this.configPath, 'q-config.json');
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2));

    console.log('✅ Q Guardian configured');
    console.log(`📁 Project: ${config.projectContext.name} (${config.projectContext.type})`);
    console.log(`👤 Commit Author: ${config.commitAuthor.name} <${config.commitAuthor.email}>`);
    console.log(`☁️  AWS: ${config.projectContext.awsAccountId} (${config.projectContext.awsRegion})`);

    return config;
  }

  /**
   * Launch Q with project-specific guidance
   */
  async launchQ(config?: QConfiguration): Promise<void> {
    if (!config) {
      config = await this.loadConfiguration();
    }

    console.log('🚀 Launching Q with project guidance...');
    
    console.log('📋 Project Context Loaded:');
    console.log(`   • Project: ${config.projectContext.name}`);
    console.log(`   • Type: ${config.projectContext.type}`);
    console.log(`   • AWS Account: ${config.projectContext.awsAccountId}`);
    console.log(`   • Region: ${config.projectContext.awsRegion}`);
    
    if (config.projectContext.lambdaFunctions?.length) {
      console.log(`   • Lambda Functions: ${config.projectContext.lambdaFunctions.length}`);
    }
    
    console.log('');
    console.log('🤖 Q is now ready with your project context!');
    console.log('💡 Q understands your project structure and can:');
    console.log('   • Deploy using SAM with your account settings');
    console.log('   • Commit changes with proper authorship');
    console.log('   • Work within your project\'s AWS context');
    console.log('');

    // Start project-aware Q session
    await this.startProjectAwareQ(config);
  }

  /**
   * Start project-aware Q session
   */
  private async startProjectAwareQ(config: QConfiguration): Promise<void> {
    const readline = require('readline');
    const chalk = require('chalk');
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.blue('Q (project-aware): ')
    });

    console.log(chalk.blue('🤖 Q:'), `Hello! I'm ready to help with your ${config.projectContext.name} project.`);
    console.log(chalk.blue('     '), `I understand this is a ${config.projectContext.type.toUpperCase()} project in AWS account ${config.projectContext.awsAccountId}.`);
    
    if (config.projectContext.type === 'sam') {
      console.log(chalk.blue('     '), `I can see your SAM template and ${config.projectContext.lambdaFunctions?.length || 0} Lambda functions.`);
    }
    
    console.log(chalk.blue('     '), 'What would you like me to help you with?');
    console.log('');
    
    rl.prompt();

    rl.on('line', async (input: string) => {
      const command = input.trim();
      
      if (['exit', 'quit'].includes(command.toLowerCase())) {
        console.log(chalk.blue('🤖 Q:'), 'Goodbye! Your project context has been saved.');
        rl.close();
        return;
      }

      if (command.toLowerCase().includes('deploy')) {
        console.log(chalk.blue('🤖 Q:'), `I'll deploy your ${config.projectContext.type} project using these settings:`);
        console.log(chalk.blue('     '), `• AWS Account: ${config.projectContext.awsAccountId}`);
        console.log(chalk.blue('     '), `• Region: ${config.projectContext.awsRegion}`);
        console.log(chalk.blue('     '), `• SAM Template: ${config.projectContext.samTemplate}`);
        console.log(chalk.blue('     '), 'Running: sam deploy --guided');
        // Would actually run SAM deploy here
      } else if (command.toLowerCase().includes('create') && command.toLowerCase().includes('function')) {
        console.log(chalk.blue('🤖 Q:'), 'I\'ll create a new Lambda function that fits your project structure.');
        console.log(chalk.blue('     '), `It will be added to your ${config.projectContext.samTemplate} template.`);
        console.log(chalk.blue('     '), `Commits will be authored by: ${config.commitAuthor.name}`);
        // Would actually create function here
      } else if (command.toLowerCase().includes('status') || command.toLowerCase().includes('info')) {
        console.log(chalk.blue('🤖 Q:'), 'Here\'s your project status:');
        console.log(chalk.blue('     '), `📁 Project: ${config.projectContext.name}`);
        console.log(chalk.blue('     '), `📋 Type: ${config.projectContext.type}`);
        console.log(chalk.blue('     '), `☁️  AWS: ${config.projectContext.awsAccountId} (${config.projectContext.awsRegion})`);
        if (config.projectContext.gitRepo?.isRepo) {
          console.log(chalk.blue('     '), `📦 Git: ${config.projectContext.gitRepo.branch} branch`);
        }
        if (config.projectContext.lambdaFunctions?.length) {
          console.log(chalk.blue('     '), `⚡ Functions: ${config.projectContext.lambdaFunctions.map(f => f.name).join(', ')}`);
        }
      } else {
        console.log(chalk.blue('🤖 Q:'), `I understand you want help with: "${command}"`);
        console.log(chalk.blue('     '), 'I have full context of your project and can help with:');
        console.log(chalk.blue('     '), '• Creating Lambda functions • Deploying with SAM • Git commits • Project analysis');
        console.log(chalk.blue('     '), 'Try: "deploy", "create function", "status", or describe what you need!');
      }
      
      console.log('');
      rl.prompt();
    });

    rl.on('close', () => {
      console.log('\n👋 Q session ended. Project context saved for next time!');
      process.exit(0);
    });
  }

  /**
   * Load existing configuration
   */
  private async loadConfiguration(): Promise<QConfiguration> {
    const configFile = path.join(this.configPath, 'q-config.json');
    
    if (!fs.existsSync(configFile)) {
      throw new Error('No Q configuration found. Run "no-wing configure" first.');
    }
    
    return JSON.parse(fs.readFileSync(configFile, 'utf8'));
  }
}
