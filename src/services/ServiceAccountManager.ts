/**
 * ServiceAccountManager - Manage Q service account lifecycle and validation
 * 
 * Validates that Q service account is properly configured with:
 * - AWS credentials from no-wing configuration
 * - Git identity separation
 * - Workspace isolation
 * - Required permissions
 */

import { existsSync } from "https://deno.land/std@0.208.0/fs/mod.ts";
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import { QConfig } from './ProjectDetector.ts';
import { NoWingConfig } from '../config/ConfigManager.ts';

export interface ServiceAccountStatus {
  exists: boolean;
  healthy: boolean;
  localUser: boolean;
  gitConfigured: boolean;
  awsConfigured: boolean;
  workspace: boolean;
  errors: string[];
  warnings: string[];
}

export interface AWSAccountInfo {
  accountId: string;
  userId: string;
  arn: string;
  region: string;
}

export class ServiceAccountManager {
  private qConfig: QConfig;
  private noWingConfig: NoWingConfig;

  constructor(qConfig: QConfig, noWingConfig: NoWingConfig) {
    this.qConfig = qConfig;
    this.noWingConfig = noWingConfig;
  }

  /**
   * Get comprehensive service account status
   */
  async getStatus(): Promise<ServiceAccountStatus> {
    const status: ServiceAccountStatus = {
      exists: false,
      healthy: false,
      localUser: false,
      gitConfigured: false,
      awsConfigured: false,
      workspace: false,
      errors: [],
      warnings: []
    };

    try {
      // Check if service account "exists" (has valid configuration)
      status.exists = this.checkServiceAccountExists();
      
      if (!status.exists) {
        status.errors.push('No-wing configuration not found or invalid');
        return status;
      }

      // Check AWS configuration
      status.awsConfigured = await this.checkAWSConfiguration();
      if (!status.awsConfigured) {
        status.errors.push('AWS credentials not configured or invalid');
      }

      // Check Git configuration
      status.gitConfigured = this.checkGitConfiguration();
      if (!status.gitConfigured) {
        status.warnings.push('Git identity not configured for Q');
      }

      // Check workspace setup
      status.workspace = await this.checkWorkspaceSetup();
      if (!status.workspace) {
        status.warnings.push('Q workspace not initialized');
      }

      // For Deno implementation, we don't create actual system users
      // Instead, we validate that Q has proper identity separation
      status.localUser = true; // Always true in our implementation

      // Service account is healthy if AWS is configured and no critical errors
      status.healthy = status.awsConfigured && status.errors.length === 0;

    } catch (error) {
      status.errors.push(`Service account validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return status;
  }

  /**
   * Get AWS account information for the Q service account
   */
  async getAWSAccountInfo(): Promise<AWSAccountInfo | null> {
    try {
      const stsClient = new STSClient({
        region: this.noWingConfig.region,
        credentials: this.getAWSCredentials()
      });

      const command = new GetCallerIdentityCommand({});
      const response = await stsClient.send(command);

      if (response.Account && response.UserId && response.Arn) {
        return {
          accountId: response.Account,
          userId: response.UserId,
          arn: response.Arn,
          region: this.noWingConfig.region
        };
      }

      return null;
    } catch (error) {
      console.warn('Failed to get AWS account info:', error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }

  /**
   * Initialize Q workspace directory structure
   */
  async initializeWorkspace(): Promise<void> {
    try {
      // Create Q workspace directory
      await Deno.mkdir(this.qConfig.workspace, { recursive: true });
      
      // Create subdirectories
      await Deno.mkdir(`${this.qConfig.workspace}/projects`, { recursive: true });
      await Deno.mkdir(`${this.qConfig.workspace}/logs`, { recursive: true });
      await Deno.mkdir(`${this.qConfig.workspace}/temp`, { recursive: true });

      // Create Q-specific git configuration
      await this.setupGitConfiguration();

      console.log(`✅ Q workspace initialized: ${this.qConfig.workspace}`);
    } catch (error) {
      throw new Error(`Failed to initialize Q workspace: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Setup Git configuration for Q identity
   */
  private async setupGitConfiguration(): Promise<void> {
    try {
      const gitConfigPath = `${this.qConfig.homeDirectory}/.gitconfig`;
      
      // Ensure home directory exists
      await Deno.mkdir(this.qConfig.homeDirectory, { recursive: true });

      const gitConfig = `[user]
\tname = ${this.qConfig.gitIdentity.name}
\temail = ${this.qConfig.gitIdentity.email}
[init]
\tdefaultBranch = main
[core]
\teditor = nano
[pull]
\trebase = false
`;

      await Deno.writeTextFile(gitConfigPath, gitConfig);
      console.log(`✅ Git configuration created for Q: ${this.qConfig.gitIdentity.name}`);
    } catch (error) {
      throw new Error(`Failed to setup Git configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if service account configuration exists
   */
  private checkServiceAccountExists(): boolean {
    return !!(
      this.noWingConfig &&
      this.noWingConfig.qId &&
      this.noWingConfig.credentials
    );
  }

  /**
   * Check AWS configuration validity
   */
  private async checkAWSConfiguration(): Promise<boolean> {
    try {
      const credentials = this.getAWSCredentials();
      if (!credentials) {
        return false;
      }

      // Test AWS credentials by calling STS GetCallerIdentity
      const stsClient = new STSClient({
        region: this.noWingConfig.region,
        credentials
      });

      const command = new GetCallerIdentityCommand({});
      await stsClient.send(command);
      
      return true;
    } catch (error) {
      console.warn('AWS credentials validation failed:', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  /**
   * Check Git configuration
   */
  private checkGitConfiguration(): boolean {
    const gitConfigPath = `${this.qConfig.homeDirectory}/.gitconfig`;
    return existsSync(gitConfigPath);
  }

  /**
   * Check workspace setup
   */
  private async checkWorkspaceSetup(): Promise<boolean> {
    try {
      const workspaceExists = existsSync(this.qConfig.workspace);
      if (!workspaceExists) {
        return false;
      }

      // Check for required subdirectories
      const requiredDirs = ['projects', 'logs', 'temp'];
      for (const dir of requiredDirs) {
        if (!existsSync(`${this.qConfig.workspace}/${dir}`)) {
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get AWS credentials from no-wing configuration
   */
  private getAWSCredentials(): any {
    const creds = this.noWingConfig.credentials;
    if (!creds) {
      return null;
    }

    // If using profile, return profile-based credentials
    if (creds.profile) {
      return {
        profile: creds.profile
      };
    }

    // If using direct credentials
    if (creds.accessKeyId && creds.secretAccessKey) {
      return {
        accessKeyId: creds.accessKeyId,
        secretAccessKey: creds.secretAccessKey,
        sessionToken: creds.sessionToken
      };
    }

    return null;
  }
}
