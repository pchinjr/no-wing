/**
 * Configure command - Set up Q with project context
 */

import chalk from 'chalk';
import ora from 'ora';
import { ProjectAnalyzer } from '../services/ProjectAnalyzer';
import { QGuardian } from '../services/QGuardian';

export async function configureCommand(options: { path?: string }): Promise<void> {
  console.log(chalk.cyan('🔧 Configuring Q Guardian for your project'));
  console.log('==========================================');
  console.log('');

  const projectPath = options.path || process.cwd();
  const spinner = ora('Analyzing your project...').start();

  try {
    // Analyze the project
    const analyzer = new ProjectAnalyzer();
    const projectContext = await analyzer.analyzeProject(projectPath);
    
    spinner.succeed('Project analysis complete');
    console.log('');

    // Configure Q Guardian
    const guardian = new QGuardian();
    const config = await guardian.configureQ(projectContext);

    console.log('');
    console.log(chalk.green('✅ Q Guardian configured successfully!'));
    console.log('');
    console.log(chalk.yellow('📋 Configuration Summary:'));
    console.log(`   Project: ${chalk.cyan(config.projectContext.name)}`);
    console.log(`   Type: ${chalk.cyan(config.projectContext.type.toUpperCase())}`);
    console.log(`   AWS Account: ${chalk.cyan(config.projectContext.awsAccountId)}`);
    console.log(`   Region: ${chalk.cyan(config.projectContext.awsRegion)}`);
    console.log(`   Commit Author: ${chalk.cyan(config.commitAuthor.name)} <${config.commitAuthor.email}>`);
    
    if (config.projectContext.type === 'sam') {
      console.log(`   SAM Template: ${chalk.cyan(config.projectContext.samTemplate || 'Not found')}`);
      console.log(`   Lambda Functions: ${chalk.cyan(config.projectContext.lambdaFunctions?.length || 0)}`);
    }

    console.log('');
    console.log(chalk.yellow('🚀 Next Steps:'));
    console.log('   Run "no-wing launch" to start Q with your project context');
    console.log('   Or run "no-wing setup" to configure and launch in one step');
    console.log('');
    console.log(chalk.gray('💡 Q will now understand your project structure and AWS settings'));

  } catch (error) {
    spinner.fail('Configuration failed');
    console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}
