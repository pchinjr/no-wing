/**
 * CredentialManager - Handle AWS credential validation and user prompting
 */

import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import { IAMClient, GetUserCommand } from '@aws-sdk/client-iam';
import chalk from 'chalk';
import inquirer from 'inquirer';

export interface AWSCredentialInfo {
  accountId: string;
  userId: string;
  arn: string;
  region: string;
  hasAdminAccess: boolean;
}

export interface CredentialPromptOptions {
  operation: 'setup' | 'cleanup' | 'status';
  requiresAdmin: boolean;
  qUsername?: string;
}

export class CredentialManager {
  private region: string;

  constructor(region: string = 'us-east-1') {
    this.region = region;
  }

  /**
   * Check if AWS credentials are available and valid
   */
  async validateCredentials(): Promise<AWSCredentialInfo | null> {
    try {
      const stsClient = new STSClient({ region: this.region });
      const command = new GetCallerIdentityCommand({});
      const response = await stsClient.send(command);

      if (!response.Account || !response.UserId || !response.Arn) {
        return null;
      }

      // Check if user has admin-level access by trying to list IAM users
      const hasAdminAccess = await this.checkAdminAccess();

      return {
        accountId: response.Account,
        userId: response.UserId,
        arn: response.Arn,
        region: this.region,
        hasAdminAccess
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if current credentials have admin access
   */
  private async checkAdminAccess(): Promise<boolean> {
    try {
      const iamClient = new IAMClient({ region: this.region });
      
      // Try to get current user info - this requires IAM read access
      const command = new GetUserCommand({});
      await iamClient.send(command);
      
      return true;
    } catch (error: any) {
      // If we get AccessDenied, we don't have admin access
      // If we get other errors, assume no admin access for safety
      return false;
    }
  }

  /**
   * Prompt user about AWS credential usage with clear explanation
   */
  async promptForCredentialUsage(options: CredentialPromptOptions): Promise<boolean> {
    console.log(chalk.yellow('🔐 AWS Credentials Required'));
    console.log('');
    
    // Explain why credentials are needed
    switch (options.operation) {
      case 'setup':
        console.log(chalk.gray('no-wing needs AWS credentials to:'));
        console.log(chalk.gray('  • Create IAM user for Q service account'));
        console.log(chalk.gray('  • Generate access keys for Q'));
        console.log(chalk.gray('  • Attach appropriate policies to Q'));
        if (options.qUsername) {
          console.log(chalk.gray(`  • Set up AWS profile: ${options.qUsername}`));
        }
        break;
      
      case 'cleanup':
        console.log(chalk.gray('no-wing needs AWS credentials to:'));
        console.log(chalk.gray('  • Delete Q\'s IAM user'));
        console.log(chalk.gray('  • Remove Q\'s access keys'));
        console.log(chalk.gray('  • Clean up Q\'s AWS resources'));
        break;
      
      case 'status':
        console.log(chalk.gray('no-wing needs AWS credentials to:'));
        console.log(chalk.gray('  • Check if Q\'s IAM user exists'));
        console.log(chalk.gray('  • Verify Q\'s AWS configuration'));
        console.log(chalk.gray('  • Display AWS account information'));
        break;
    }
    
    console.log('');
    console.log(chalk.cyan('🛡️  Security Notes:'));
    console.log(chalk.gray('  • Your credentials are only used for this operation'));
    console.log(chalk.gray('  • Q will get its own separate AWS credentials'));
    console.log(chalk.gray('  • Q will never use your personal credentials'));
    console.log(chalk.gray('  • All Q actions will be clearly attributed to Q'));
    console.log('');

    const { proceed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'proceed',
        message: `Use your AWS credentials for ${options.operation} operation?`,
        default: true
      }
    ]);

    return proceed;
  }

  /**
   * Display current AWS credential information
   */
  displayCredentialInfo(credInfo: AWSCredentialInfo): void {
    console.log(chalk.yellow('📋 Current AWS Credentials:'));
    console.log(`  Account ID: ${chalk.green(credInfo.accountId)}`);
    console.log(`  User/Role: ${chalk.gray(this.extractUserFromArn(credInfo.arn))}`);
    console.log(`  Region: ${chalk.gray(credInfo.region)}`);
    
    if (credInfo.hasAdminAccess) {
      console.log(`  Permissions: ${chalk.green('✅ Admin access detected')}`);
    } else {
      console.log(`  Permissions: ${chalk.yellow('⚠️  Limited access - may not be sufficient')}`);
    }
    console.log('');
  }

  /**
   * Check credentials and prompt user if needed
   */
  async checkAndPromptCredentials(options: CredentialPromptOptions): Promise<AWSCredentialInfo | null> {
    // First, try to validate existing credentials
    const credInfo = await this.validateCredentials();
    
    if (!credInfo) {
      console.log(chalk.red('❌ No valid AWS credentials found'));
      console.log('');
      console.log(chalk.yellow('💡 To provide AWS credentials, you can:'));
      console.log('  • Set environment variables: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY');
      console.log('  • Use AWS profile: export AWS_PROFILE=your-profile');
      console.log('  • Configure default credentials: aws configure');
      console.log('  • Use IAM role (if running on AWS)');
      console.log('');
      return null;
    }

    // Display current credential info
    this.displayCredentialInfo(credInfo);

    // Check if admin access is required but not available
    if (options.requiresAdmin && !credInfo.hasAdminAccess) {
      console.log(chalk.yellow('⚠️  Warning: Limited AWS permissions detected'));
      console.log(chalk.gray('The current credentials may not have sufficient permissions for this operation.'));
      console.log(chalk.gray('You may need IAM admin access to create/manage Q service accounts.'));
      console.log('');
    }

    // Prompt user for confirmation
    const proceed = await this.promptForCredentialUsage(options);
    
    if (!proceed) {
      console.log(chalk.gray('Operation cancelled by user.'));
      return null;
    }

    return credInfo;
  }

  /**
   * Extract user/role name from ARN
   */
  private extractUserFromArn(arn: string): string {
    // Extract user or role name from ARN
    // Examples:
    // arn:aws:iam::123456789012:user/username -> username
    // arn:aws:iam::123456789012:role/rolename -> rolename
    // arn:aws:sts::123456789012:assumed-role/rolename/session -> rolename
    
    const parts = arn.split('/');
    if (parts.length >= 2) {
      return parts[parts.length - 1];
    }
    
    // Fallback: return the last part of the ARN
    return arn.split(':').pop() || 'unknown';
  }

  /**
   * Get credential resolution guidance
   */
  getCredentialGuidance(): string[] {
    return [
      'AWS credentials can be provided in several ways (in order of precedence):',
      '',
      '1. Environment Variables:',
      '   export AWS_ACCESS_KEY_ID=your-access-key',
      '   export AWS_SECRET_ACCESS_KEY=your-secret-key',
      '   export AWS_DEFAULT_REGION=us-east-1',
      '',
      '2. AWS Profile:',
      '   export AWS_PROFILE=your-profile-name',
      '   # or use --profile flag with AWS CLI',
      '',
      '3. AWS Configuration Files:',
      '   ~/.aws/credentials (default profile)',
      '   ~/.aws/config',
      '',
      '4. IAM Role (if running on AWS):',
      '   EC2 instance profile',
      '   Lambda execution role',
      '   ECS task role',
      '',
      'For no-wing operations, you typically need:',
      '• IAM user/role creation permissions',
      '• IAM policy attachment permissions', 
      '• Access key generation permissions'
    ];
  }
}
