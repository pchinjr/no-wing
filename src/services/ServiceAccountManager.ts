/**
 * ServiceAccountManager - Manage Q service account lifecycle
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import type { QServiceAccountConfig } from './ProjectDetector.js';
import { AWSIdentityManager, type AWSCredentials } from './AWSIdentityManager.js';
import { PolicyGenerator } from './PolicyGenerator.js';

export interface ServiceAccountStatus {
  exists: boolean;
  localUser: boolean;
  homeDirectory: boolean;
  gitConfigured: boolean;
  awsConfigured: boolean;
  workspace: boolean;
  healthy: boolean;
  awsUser?: boolean;
  awsCredentials?: boolean;
}

export class ServiceAccountManager {
  private config: QServiceAccountConfig;
  private awsManager?: AWSIdentityManager;

  constructor(config: QServiceAccountConfig) {
    this.config = config;
  }

  /**
   * Create the complete Q service account
   */
  async create(force: boolean = false, includeAWS: boolean = true): Promise<void> {
    if (!force) {
      const status = await this.getStatus();
      if (status.exists) {
        throw new Error(`Service account ${this.config.username} already exists. Use --force to recreate.`);
      }
    }

    // Create local user account
    await this.createLocalUser();
    
    // Setup home directory structure
    await this.setupHomeDirectory();
    
    // Configure git identity
    await this.configureGitIdentity();
    
    // Setup workspace
    await this.setupWorkspace();
    
    // Setup AWS identity if requested
    if (includeAWS) {
      await this.setupAWSIdentity();
    }
  }

  /**
   * Setup AWS identity for the service account
   */
  async setupAWSIdentity(): Promise<void> {
    // Generate policies based on project type
    const policySet = PolicyGenerator.generatePolicies(this.config.projectType);
    
    // Initialize AWS manager
    this.awsManager = new AWSIdentityManager({
      username: this.config.username,
      policies: policySet.managedPolicies,
      region: 'us-east-1', // TODO: Make configurable
      homeDirectory: this.config.homeDirectory
    });

    // Create IAM user
    await this.awsManager.createIAMUser();
    
    // Attach policies
    await this.awsManager.attachPolicies();
    
    // Create access keys
    const credentials = await this.awsManager.createAccessKeys();
    
    // Setup AWS profile
    await this.awsManager.setupAWSProfile(credentials);
    
    // Set proper ownership
    await this.executeAsRoot(`chown -R ${this.config.username}:${this.config.username} ${path.join(this.config.homeDirectory, '.aws')}`);
  }

  /**
   * Get service account status
   */
  async getStatus(): Promise<ServiceAccountStatus> {
    const localUser = await this.checkLocalUser();
    const homeDirectory = await this.checkHomeDirectory();
    const gitConfigured = await this.checkGitConfiguration();
    const awsConfigured = await this.checkAWSConfiguration();
    const workspace = await this.checkWorkspace();
    
    // Check AWS user existence
    let awsUser = false;
    let awsCredentials = false;
    
    if (awsConfigured) {
      try {
        const policySet = PolicyGenerator.generatePolicies(this.config.projectType);
        this.awsManager = new AWSIdentityManager({
          username: this.config.username,
          policies: policySet.managedPolicies,
          region: 'us-east-1',
          homeDirectory: this.config.homeDirectory
        });
        
        awsUser = await this.awsManager.userExists();
        awsCredentials = await this.checkAWSCredentials();
      } catch (error) {
        // AWS check failed, but local AWS config exists
        awsCredentials = true;
      }
    }

    return {
      exists: localUser,
      localUser,
      homeDirectory,
      gitConfigured,
      awsConfigured,
      workspace,
      awsUser,
      awsCredentials,
      healthy: localUser && homeDirectory && gitConfigured && workspace && awsConfigured
    };
  }

  /**
   * Remove the Q service account and all associated resources
   */
  async cleanup(keepLogs: boolean = false): Promise<void> {
    // Clean up AWS resources first
    if (this.awsManager || await this.checkAWSConfiguration()) {
      try {
        if (!this.awsManager) {
          const policySet = PolicyGenerator.generatePolicies(this.config.projectType);
          this.awsManager = new AWSIdentityManager({
            username: this.config.username,
            policies: policySet.managedPolicies,
            region: 'us-east-1',
            homeDirectory: this.config.homeDirectory
          });
        }
        
        await this.awsManager.deleteIAMUser();
      } catch (error) {
        console.warn(`Warning: Could not clean up AWS resources: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    // Remove local user (this also removes home directory)
    await this.removeLocalUser();
    
    // Clean up any remaining files
    if (!keepLogs) {
      await this.cleanupLogs();
    }
  }

  /**
   * Check if AWS credentials file has valid credentials
   */
  private async checkAWSCredentials(): Promise<boolean> {
    try {
      const credentialsPath = path.join(this.config.homeDirectory, '.aws', 'credentials');
      const credentialsContent = await fs.readFile(credentialsPath, 'utf8');
      
      return credentialsContent.includes(`[${this.config.username}]`) &&
             credentialsContent.includes('aws_access_key_id') &&
             credentialsContent.includes('aws_secret_access_key');
    } catch {
      return false;
    }
  }

  /**
   * Get AWS account information
   */
  async getAWSAccountInfo(): Promise<{ accountId: string; region: string } | null> {
    try {
      if (!this.awsManager) {
        const policySet = PolicyGenerator.generatePolicies(this.config.projectType);
        this.awsManager = new AWSIdentityManager({
          username: this.config.username,
          policies: policySet.managedPolicies,
          region: 'us-east-1',
          homeDirectory: this.config.homeDirectory
        });
      }
      
      return await this.awsManager.getCurrentAccount();
    } catch {
      return null;
    }
  }

  /**
   * Get policy summary for the project type
   */
  getPolicySummary(): string[] {
    const policySet = PolicyGenerator.generatePolicies(this.config.projectType);
    return PolicyGenerator.getPolicySummary(policySet);
  }

  // ... (keep all existing private methods unchanged)

  /**
   * Create local user account for Q
   */
  private async createLocalUser(): Promise<void> {
    return new Promise((resolve, reject) => {
      const createUser = spawn('sudo', [
        'useradd',
        '-m',                    // Create home directory
        '-s', '/bin/bash',       // Set shell
        '-c', `Q Assistant for ${this.config.projectName}`,  // Comment
        this.config.username
      ]);

      createUser.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Failed to create user ${this.config.username}`));
        }
      });

      createUser.on('error', (error) => {
        reject(new Error(`Error creating user: ${error.message}`));
      });
    });
  }

  /**
   * Setup home directory structure
   */
  private async setupHomeDirectory(): Promise<void> {
    const homeDir = this.config.homeDirectory;
    
    // Create necessary directories
    const directories = [
      path.join(homeDir, '.aws'),
      path.join(homeDir, '.ssh'),
      path.join(homeDir, '.no-wing'),
      path.join(homeDir, '.no-wing', 'logs'),
      path.join(homeDir, 'workspace')
    ];

    for (const dir of directories) {
      await this.createDirectoryAsUser(dir);
    }

    // Set proper permissions
    await this.executeAsRoot(`chown -R ${this.config.username}:${this.config.username} ${homeDir}`);
    await this.executeAsRoot(`chmod 700 ${path.join(homeDir, '.ssh')}`);
    await this.executeAsRoot(`chmod 700 ${path.join(homeDir, '.aws')}`);
  }

  /**
   * Configure git identity for Q
   */
  private async configureGitIdentity(): Promise<void> {
    const homeDir = this.config.homeDirectory;
    const gitConfig = [
      '[user]',
      `    name = ${this.config.gitIdentity.name}`,
      `    email = ${this.config.gitIdentity.email}`,
      '[core]',
      '    editor = nano',
      '[init]',
      '    defaultBranch = main'
    ].join('\n');

    const gitConfigPath = path.join(homeDir, '.gitconfig');
    await this.writeFileAsUser(gitConfigPath, gitConfig);
  }

  /**
   * Setup workspace directory
   */
  private async setupWorkspace(): Promise<void> {
    const workspaceDir = this.config.workspace;
    
    // Create workspace readme
    const readme = [
      '# Q Assistant Workspace',
      '',
      `This is the workspace for Q Assistant (${this.config.projectName})`,
      '',
      '## Directory Structure',
      '- `project/` - Cloned project files',
      '- `temp/` - Temporary files',
      '- `logs/` - Q operation logs',
      '',
      '## Identity',
      `- User: ${this.config.username}`,
      `- Git: ${this.config.gitIdentity.name} <${this.config.gitIdentity.email}>`,
      `- AWS Profile: ${this.config.awsProfile}`,
    ].join('\n');

    await this.writeFileAsUser(path.join(workspaceDir, 'README.md'), readme);
  }

  /**
   * Check if local user exists
   */
  private async checkLocalUser(): Promise<boolean> {
    return new Promise((resolve) => {
      const checkUser = spawn('id', [this.config.username]);
      checkUser.on('close', (code) => {
        resolve(code === 0);
      });
      checkUser.on('error', () => {
        resolve(false);
      });
    });
  }

  /**
   * Check if home directory exists and is properly configured
   */
  private async checkHomeDirectory(): Promise<boolean> {
    try {
      const homeDir = this.config.homeDirectory;
      const requiredDirs = ['.aws', '.ssh', '.no-wing', 'workspace'];
      
      for (const dir of requiredDirs) {
        await fs.access(path.join(homeDir, dir));
      }
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if git is properly configured
   */
  private async checkGitConfiguration(): Promise<boolean> {
    try {
      const gitConfigPath = path.join(this.config.homeDirectory, '.gitconfig');
      const gitConfig = await fs.readFile(gitConfigPath, 'utf8');
      return gitConfig.includes(this.config.gitIdentity.name) && 
             gitConfig.includes(this.config.gitIdentity.email);
    } catch {
      return false;
    }
  }

  /**
   * Check if AWS is properly configured
   */
  private async checkAWSConfiguration(): Promise<boolean> {
    try {
      const awsConfigPath = path.join(this.config.homeDirectory, '.aws', 'credentials');
      await fs.access(awsConfigPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if workspace is properly configured
   */
  private async checkWorkspace(): Promise<boolean> {
    try {
      const workspaceReadme = path.join(this.config.workspace, 'README.md');
      await fs.access(workspaceReadme);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Remove local user account
   */
  private async removeLocalUser(): Promise<void> {
    return new Promise((resolve, reject) => {
      const removeUser = spawn('sudo', [
        'userdel',
        '-r',  // Remove home directory
        this.config.username
      ]);

      removeUser.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Failed to remove user ${this.config.username}`));
        }
      });

      removeUser.on('error', (error) => {
        reject(new Error(`Error removing user: ${error.message}`));
      });
    });
  }

  /**
   * Clean up logs and temporary files
   */
  private async cleanupLogs(): Promise<void> {
    // Remove any remaining log files in project directory
    const projectLogDir = path.join(process.cwd(), '.no-wing');
    try {
      await fs.rm(projectLogDir, { recursive: true, force: true });
    } catch {
      // Ignore if directory doesn't exist
    }
  }

  /**
   * Create directory as the Q user
   */
  private async createDirectoryAsUser(dirPath: string): Promise<void> {
    return this.executeAsRoot(`mkdir -p ${dirPath}`);
  }

  /**
   * Write file as the Q user
   */
  private async writeFileAsUser(filePath: string, content: string): Promise<void> {
    // Write file as root first, then change ownership
    await fs.writeFile(filePath, content);
    await this.executeAsRoot(`chown ${this.config.username}:${this.config.username} ${filePath}`);
  }

  /**
   * Execute command as root
   */
  private async executeAsRoot(command: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const proc = spawn('sudo', ['bash', '-c', command]);
      
      proc.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed: ${command}`));
        }
      });

      proc.on('error', (error) => {
        reject(new Error(`Error executing command: ${error.message}`));
      });
    });
  }

  /**
   * Get the service account configuration
   */
  getConfig(): QServiceAccountConfig {
    return this.config;
  }
}
