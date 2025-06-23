/**
 * Q Git Identity Management
 * 
 * Manages Q's Git identity and commit attribution to maintain clear
 * audit trails between human and AI contributions
 */

import { execSync } from 'child_process';
import { QIdentity } from './identity';
import chalk from 'chalk';

export interface QGitConfig {
  name: string;
  email: string;
  signingKey?: string;
}

export class QGitIdentityManager {
  private qIdentity: QIdentity;
  private originalGitConfig: { name: string; email: string } | null = null;

  constructor(qIdentity: QIdentity) {
    this.qIdentity = qIdentity;
  }

  /**
   * Set up Q's Git identity for commits
   */
  async setupQGitIdentity(): Promise<void> {
    console.log(chalk.blue('🔧 Setting up Q\'s Git identity...'));

    // Store original Git config
    await this.storeOriginalGitConfig();

    // Configure Q's Git identity
    const qGitConfig = this.generateQGitConfig();
    
    try {
      execSync(`git config user.name "${qGitConfig.name}"`, { stdio: 'pipe' });
      execSync(`git config user.email "${qGitConfig.email}"`, { stdio: 'pipe' });
      
      console.log(chalk.green(`✅ Q's Git identity configured:`));
      console.log(chalk.cyan(`   Name: ${qGitConfig.name}`));
      console.log(chalk.cyan(`   Email: ${qGitConfig.email}`));
      
      // Add Q's identity to .no-wing config
      await this.saveQGitConfig(qGitConfig);
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to configure Q\'s Git identity:'), error);
      throw error;
    }
  }

  /**
   * Restore human developer's Git identity
   */
  async restoreHumanGitIdentity(): Promise<void> {
    if (!this.originalGitConfig) {
      console.log(chalk.yellow('⚠️ No original Git config to restore'));
      return;
    }

    try {
      execSync(`git config user.name "${this.originalGitConfig.name}"`, { stdio: 'pipe' });
      execSync(`git config user.email "${this.originalGitConfig.email}"`, { stdio: 'pipe' });
      
      console.log(chalk.green('✅ Restored human developer Git identity'));
      console.log(chalk.cyan(`   Name: ${this.originalGitConfig.name}`));
      console.log(chalk.cyan(`   Email: ${this.originalGitConfig.email}`));
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to restore Git identity:'), error);
      throw error;
    }
  }

  /**
   * Make a commit as Q with proper attribution
   */
  async commitAsQ(message: string, files: string[] = ['.']): Promise<string> {
    console.log(chalk.blue('🤖 Q is making a commit...'));

    // Ensure Q's Git identity is active
    await this.setupQGitIdentity();

    try {
      // Add files
      for (const file of files) {
        execSync(`git add ${file}`, { stdio: 'pipe' });
      }

      // Create commit with Q's identity and metadata
      const enhancedMessage = this.enhanceCommitMessage(message);
      execSync(`git commit -m "${enhancedMessage}"`, { stdio: 'pipe' });

      // Get the commit hash
      const commitHash = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
      
      console.log(chalk.green(`✅ Q committed: ${commitHash.substring(0, 8)}`));
      console.log(chalk.gray(`   Message: ${message}`));

      // IMPORTANT: Restore human Git identity after Q's commit
      await this.restoreHumanGitIdentity();

      return commitHash;

    } catch (error) {
      console.error(chalk.red('❌ Q failed to make commit:'), error);
      // Always try to restore human identity even if commit failed
      try {
        await this.restoreHumanGitIdentity();
      } catch (restoreError) {
        console.error(chalk.red('❌ Failed to restore human Git identity:'), restoreError);
      }
      throw error;
    }
  }

  /**
   * Check if current Git identity is Q's
   */
  isCurrentIdentityQ(): boolean {
    try {
      const currentName = execSync('git config user.name', { encoding: 'utf-8' }).trim();
      const currentEmail = execSync('git config user.email', { encoding: 'utf-8' }).trim();
      
      const qConfig = this.generateQGitConfig();
      return currentName === qConfig.name && currentEmail === qConfig.email;
      
    } catch (error) {
      return false;
    }
  }

  /**
   * Get commit history showing Q vs human commits
   */
  getCommitHistory(limit: number = 10): Array<{
    hash: string;
    author: string;
    email: string;
    date: string;
    message: string;
    isQ: boolean;
  }> {
    try {
      const gitLog = execSync(
        `git log --pretty=format:"%H|%an|%ae|%ad|%s" --date=iso -${limit}`,
        { encoding: 'utf-8' }
      );

      const qConfig = this.generateQGitConfig();
      
      return gitLog.split('\n').map(line => {
        const [hash, author, email, date, message] = line.split('|');
        return {
          hash: hash.substring(0, 8),
          author,
          email,
          date,
          message,
          isQ: email === qConfig.email
        };
      });

    } catch (error) {
      console.error('Error getting commit history:', error);
      return [];
    }
  }

  /**
   * Store original human Git configuration
   */
  private async storeOriginalGitConfig(): Promise<void> {
    try {
      const name = execSync('git config user.name', { encoding: 'utf-8' }).trim();
      const email = execSync('git config user.email', { encoding: 'utf-8' }).trim();
      
      this.originalGitConfig = { name, email };
      
      console.log(chalk.gray(`📝 Stored original Git config: ${name} <${email}>`));
      
    } catch (error) {
      console.log(chalk.yellow('⚠️ No existing Git config found'));
      this.originalGitConfig = null;
    }
  }

  /**
   * Generate Q's Git configuration
   */
  private generateQGitConfig(): QGitConfig {
    return {
      name: `Q (AI Agent ${this.qIdentity.id.split('-')[1]})`,
      email: `q+${this.qIdentity.id}@no-wing.ai`
    };
  }

  /**
   * Enhance commit message with Q metadata
   */
  private enhanceCommitMessage(message: string): string {
    const metadata = [
      `🤖 Q-Agent: ${this.qIdentity.level}`,
      `Task-Count: ${this.qIdentity.successfulTasks}`,
      `Capability-Level: ${this.qIdentity.level}`
    ];

    return `${message}\n\n${metadata.join('\n')}`;
  }

  /**
   * Save Q's Git config to .no-wing directory
   */
  private async saveQGitConfig(config: QGitConfig): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const configPath = '.no-wing/q-git-config.json';
    const dir = path.dirname(configPath);
    
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(configPath, JSON.stringify({
      qGitConfig: config,
      originalGitConfig: this.originalGitConfig,
      setupAt: new Date().toISOString()
    }, null, 2));
  }
}
