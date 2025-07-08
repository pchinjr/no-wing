/**
 * AWSIdentityManager - Manage AWS IAM users and credentials for Q service accounts
 */

import { IAMClient, CreateUserCommand, DeleteUserCommand, CreateAccessKeyCommand, DeleteAccessKeyCommand, AttachUserPolicyCommand, DetachUserPolicyCommand, GetUserCommand, ListAccessKeysCommand } from '@aws-sdk/client-iam';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import { promises as fs } from 'fs';
import path from 'path';

export interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

export interface AWSIdentityConfig {
  username: string;
  policies: string[];
  region: string;
  homeDirectory: string;
}

export class AWSIdentityManager {
  private iamClient: IAMClient;
  private stsClient: STSClient;
  private config: AWSIdentityConfig;

  constructor(config: AWSIdentityConfig, region: string = 'us-east-1') {
    this.config = { ...config, region };
    this.iamClient = new IAMClient({ region });
    this.stsClient = new STSClient({ region });
  }

  /**
   * Create IAM user for Q service account
   */
  async createIAMUser(): Promise<void> {
    try {
      const command = new CreateUserCommand({
        UserName: this.config.username,
        Path: '/no-wing/',
        Tags: [
          { Key: 'CreatedBy', Value: 'no-wing' },
          { Key: 'Purpose', Value: 'Q-Service-Account' },
          { Key: 'Project', Value: this.config.username.replace('q-assistant-', '') }
        ]
      });

      await this.iamClient.send(command);
    } catch (error: any) {
      if (error.name === 'EntityAlreadyExistsException') {
        throw new Error(`IAM user ${this.config.username} already exists`);
      }
      throw new Error(`Failed to create IAM user: ${error.message}`);
    }
  }

  /**
   * Generate access keys for the IAM user
   */
  async createAccessKeys(): Promise<AWSCredentials> {
    try {
      const command = new CreateAccessKeyCommand({
        UserName: this.config.username
      });

      const response = await this.iamClient.send(command);
      
      if (!response.AccessKey?.AccessKeyId || !response.AccessKey?.SecretAccessKey) {
        throw new Error('Failed to create access keys - missing key data');
      }

      return {
        accessKeyId: response.AccessKey.AccessKeyId,
        secretAccessKey: response.AccessKey.SecretAccessKey,
        region: this.config.region
      };
    } catch (error: any) {
      throw new Error(`Failed to create access keys: ${error.message}`);
    }
  }

  /**
   * Attach policies to the IAM user
   */
  async attachPolicies(): Promise<void> {
    for (const policyArn of this.config.policies) {
      try {
        const command = new AttachUserPolicyCommand({
          UserName: this.config.username,
          PolicyArn: policyArn
        });

        await this.iamClient.send(command);
      } catch (error: any) {
        throw new Error(`Failed to attach policy ${policyArn}: ${error.message}`);
      }
    }
  }

  /**
   * Check if IAM user exists
   */
  async userExists(): Promise<boolean> {
    try {
      const command = new GetUserCommand({
        UserName: this.config.username
      });

      await this.iamClient.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NoSuchEntityException') {
        return false;
      }
      throw new Error(`Error checking user existence: ${error.message}`);
    }
  }

  /**
   * Setup AWS profile in Q's home directory
   */
  async setupAWSProfile(credentials: AWSCredentials): Promise<void> {
    const awsDir = path.join(this.config.homeDirectory, '.aws');
    const credentialsFile = path.join(awsDir, 'credentials');
    const configFile = path.join(awsDir, 'config');

    // Ensure .aws directory exists
    await fs.mkdir(awsDir, { recursive: true });

    // Create credentials file
    const credentialsContent = [
      `[${this.config.username}]`,
      `aws_access_key_id = ${credentials.accessKeyId}`,
      `aws_secret_access_key = ${credentials.secretAccessKey}`,
      ''
    ].join('\n');

    await fs.writeFile(credentialsFile, credentialsContent);

    // Create config file
    const configContent = [
      `[profile ${this.config.username}]`,
      `region = ${credentials.region}`,
      `output = json`,
      ''
    ].join('\n');

    await fs.writeFile(configFile, configContent);

    // Set proper permissions (readable only by owner)
    await fs.chmod(credentialsFile, 0o600);
    await fs.chmod(configFile, 0o600);
  }

  /**
   * Delete IAM user and all associated resources
   */
  async deleteIAMUser(): Promise<void> {
    try {
      // First, list and delete all access keys
      const listKeysCommand = new ListAccessKeysCommand({
        UserName: this.config.username
      });

      const keysResponse = await this.iamClient.send(listKeysCommand);
      
      if (keysResponse.AccessKeyMetadata) {
        for (const keyMetadata of keysResponse.AccessKeyMetadata) {
          if (keyMetadata.AccessKeyId) {
            const deleteKeyCommand = new DeleteAccessKeyCommand({
              UserName: this.config.username,
              AccessKeyId: keyMetadata.AccessKeyId
            });
            await this.iamClient.send(deleteKeyCommand);
          }
        }
      }

      // Detach all policies
      for (const policyArn of this.config.policies) {
        try {
          const detachCommand = new DetachUserPolicyCommand({
            UserName: this.config.username,
            PolicyArn: policyArn
          });
          await this.iamClient.send(detachCommand);
        } catch (error: any) {
          // Continue if policy wasn't attached
          if (error.name !== 'NoSuchEntityException') {
            console.warn(`Warning: Could not detach policy ${policyArn}: ${error.message}`);
          }
        }
      }

      // Finally, delete the user
      const deleteUserCommand = new DeleteUserCommand({
        UserName: this.config.username
      });

      await this.iamClient.send(deleteUserCommand);
    } catch (error: any) {
      if (error.name === 'NoSuchEntityException') {
        // User doesn't exist, which is fine for cleanup
        return;
      }
      throw new Error(`Failed to delete IAM user: ${error.message}`);
    }
  }

  /**
   * Get current AWS account information
   */
  async getCurrentAccount(): Promise<{ accountId: string; region: string }> {
    try {
      const command = new GetCallerIdentityCommand({});
      const response = await this.stsClient.send(command);
      
      return {
        accountId: response.Account || 'unknown',
        region: this.config.region
      };
    } catch (error: any) {
      throw new Error(`Failed to get AWS account info: ${error.message}`);
    }
  }
}
