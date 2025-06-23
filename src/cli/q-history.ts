/**
 * Q History CLI Command
 * 
 * Shows commit history with clear attribution between Q and human commits
 */

import chalk from 'chalk';
import { QIdentityManager } from '../q/identity';
import { QGitIdentityManager } from '../q/git-identity';

export async function qHistoryCommand(options: any = {}) {
  console.log(chalk.blue('🛫 no-wing Commit History'));
  console.log(chalk.gray('=========================='));
  console.log('');

  try {
    // Load Q's identity
    const identityManager = new QIdentityManager();
    const identity = await identityManager.loadIdentity();
    
    if (!identity) {
      console.log(chalk.red('❌ Q identity not found'));
      console.log(chalk.yellow('💡 Run "no-wing init" to create Q\'s identity'));
      return;
    }

    // Get commit history
    const gitManager = new QGitIdentityManager(identity);
    const commits = gitManager.getCommitHistory(options.limit || 10);

    if (commits.length === 0) {
      console.log(chalk.yellow('📝 No commits found in this repository'));
      return;
    }

    // Display commits with clear Q vs Human attribution
    console.log(chalk.cyan('📊 Recent Commits (Q vs Human):'));
    console.log('');

    commits.forEach((commit, index) => {
      const icon = commit.isQ ? '🤖' : '👨‍💻';
      const authorColor = commit.isQ ? chalk.magenta : chalk.green;
      const typeLabel = commit.isQ ? 'Q (AI Agent)' : 'Human Developer';
      
      console.log(`${icon} ${chalk.gray(commit.hash)} ${authorColor(commit.author)}`);
      console.log(`   ${chalk.gray('Type:')} ${typeLabel}`);
      console.log(`   ${chalk.gray('Date:')} ${new Date(commit.date).toLocaleString()}`);
      console.log(`   ${chalk.gray('Message:')} ${commit.message}`);
      
      if (index < commits.length - 1) {
        console.log('');
      }
    });

    console.log('');
    
    // Show summary statistics
    const qCommits = commits.filter(c => c.isQ).length;
    const humanCommits = commits.filter(c => !c.isQ).length;
    
    console.log(chalk.cyan('📈 Commit Summary:'));
    console.log(`   🤖 Q Commits: ${chalk.magenta(qCommits)}`);
    console.log(`   👨‍💻 Human Commits: ${chalk.green(humanCommits)}`);
    console.log(`   📊 Total: ${commits.length}`);
    
    if (qCommits > 0) {
      const qPercentage = ((qCommits / commits.length) * 100).toFixed(1);
      console.log(`   🤝 Q Contribution: ${qPercentage}%`);
    }

  } catch (error) {
    console.log(chalk.red('💥 Error getting commit history:'));
    console.log(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
  }
  
  console.log('');
}

export async function qGitStatusCommand(options: any = {}) {
  console.log(chalk.blue('🛫 no-wing Git Status'));
  console.log(chalk.gray('======================'));
  console.log('');

  try {
    // Load Q's identity
    const identityManager = new QIdentityManager();
    const identity = await identityManager.loadIdentity();
    
    if (!identity) {
      console.log(chalk.red('❌ Q identity not found'));
      return;
    }

    const gitManager = new QGitIdentityManager(identity);
    
    // Check current Git identity
    const isQActive = gitManager.isCurrentIdentityQ();
    
    console.log(chalk.cyan('🔍 Current Git Identity:'));
    if (isQActive) {
      console.log(`   ${chalk.magenta('🤖 Q (AI Agent)')} is currently active`);
      console.log(`   ${chalk.gray('Commits will be attributed to Q')}`);
    } else {
      console.log(`   ${chalk.green('👨‍💻 Human Developer')} is currently active`);
      console.log(`   ${chalk.gray('Commits will be attributed to you')}`);
    }
    
    console.log('');
    
    // Show Q's Git configuration
    console.log(chalk.cyan('⚙️ Q\'s Git Configuration:'));
    const qConfig = (gitManager as any).generateQGitConfig();
    console.log(`   Name: ${qConfig.name}`);
    console.log(`   Email: ${qConfig.email}`);
    
  } catch (error) {
    console.log(chalk.red('💥 Error checking Git status:'));
    console.log(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
  }
  
  console.log('');
}
