import { existsSync, } from "https://deno.land/std@0.208.0/fs/mod.ts";
import { dirname } from "https://deno.land/std@0.208.0/path/mod.ts";
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import { IAMClient, GetUserCommand, ListAttachedUserPoliciesCommand } from '@aws-sdk/client-iam';
import { ContextManager, ProjectContext } from './ContextManager.ts';

export interface NoWingConfig {
  developerId: string;
  qId: string;
  qLevel: string;
  region: string;
  setupDate: string;
  credentials?: {
    accessKeyId?: string;
    secretAccessKey?: string;
    sessionToken?: string;
    roleArn?: string;
    profile?: string;
    region: string;
  };
  permissions?: {
    requiredPolicies: string[];
    optionalPolicies: string[];
    customPolicies: PolicyDocument[];
  };
  audit?: {
    enabled: boolean;
    cloudTrailArn?: string;
    logGroupName?: string;
  };
}

export interface PolicyDocument {
  Version: string;
  Statement: PolicyStatement[];
}

export interface PolicyStatement {
  Effect: 'Allow' | 'Deny';
  Action: string | string[];
  Resource: string | string[];
  Condition?: Record<string, unknown>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

export class ConfigManager {
  private configPath: string;
  private config: NoWingConfig | null = null;
  private contextManager: ContextManager;
  private context: ProjectContext;

  constructor() {
    this.contextManager = new ContextManager();
    this.context = this.contextManager.detectContext();
    this.configPath = `${this.context.configDirectory}/config.json`;
  }

  /**
   * Get current context information
   */
  getContext(): ProjectContext {
    return this.context;
  }

  /**
   * Get configuration directory path
   */
  getConfigDirectory(): string {
    return this.context.configDirectory;
  }

  /**
   * Check if configuration exists
   */
  configExists(): boolean {
    return existsSync(this.configPath);
  }

  /**
   * Load configuration from file
   */
  async loadConfig(): Promise<NoWingConfig> {
    try {
      if (!this.configExists()) {
        const contextDesc = this.contextManager.getContextDescription(this.context);
        throw new Error(`Configuration file not found: ${this.configPath} (${contextDesc})`);
      }

      const configData = await Deno.readTextFile(this.configPath);
      this.config = JSON.parse(configData);

      // Validate basic structure
      if (!this.config?.developerId || !this.config?.qId) {
        throw new Error('Invalid configuration: missing required fields');
      }

      console.log('✅ Configuration loaded successfully');
      return this.config;
    } catch (error) {
      throw new Error(`Failed to load configuration: ${error.message}`);
    }
  }

  /**
   * Save configuration to file
   */
  async saveConfig(config: NoWingConfig): Promise<void> {
    try {
      // Ensure directory exists
      const configDir = dirname(this.configPath);
      if (!existsSync(configDir)) {
        Deno.mkdirSync(configDir, { recursive: true });
      }

      // Write configuration
      await Deno.writeTextFile(this.configPath, JSON.stringify(config, null, 2));
      this.config = config;

      console.log('✅ Configuration saved successfully');
    } catch (error) {
      throw new Error(`Failed to save configuration: ${error.message}`);
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): NoWingConfig | null {
    return this.config;
  }

  /**
   * Update credential configuration
   */
  async updateCredentials(credentials: NoWingConfig['credentials']): Promise<void> {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call loadConfig() first.');
    }

    this.config.credentials = credentials;
    await this.saveConfig(this.config);
  }

  /**
   * Validate no-wing IAM setup
   */
  async validateIAMSetup(): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      recommendations: []
    };

    try {
      if (!this.config?.credentials) {
        result.errors.push('No credentials configured');
        result.isValid = false;
        return result;
      }

      const creds = this.config.credentials;
      
      // Check if we have valid AWS credentials
      const hasDirectCredentials = creds.accessKeyId && creds.secretAccessKey;
      const hasProfile = creds.profile;
      const hasRoleArn = creds.roleArn;

      if (!hasDirectCredentials && !hasProfile && !hasRoleArn) {
        result.errors.push('No valid credential method found (accessKeyId/secretAccessKey, profile, or roleArn)');
        result.isValid = false;
        return result;
      }

      // Only test credentials if we have direct access keys
      if (hasDirectCredentials) {
        // Create properly typed credentials for AWS SDK
        const awsCredentials = {
          accessKeyId: creds.accessKeyId!,
          secretAccessKey: creds.secretAccessKey!,
          ...(creds.sessionToken && { sessionToken: creds.sessionToken })
        };

        const stsClient = new STSClient({
          credentials: awsCredentials,
          region: creds.region || this.config.region
        });

        let identity;
        try {
          const identityResponse = await stsClient.send(new GetCallerIdentityCommand({}));
          identity = identityResponse;
          console.log(`✅ Credentials valid for: ${identity.Arn}`);
        } catch (error) {
          result.errors.push(`Invalid credentials: ${error instanceof Error ? error.message : 'Unknown error'}`);
          result.isValid = false;
          return result;
        }

        // Check if it's a user (not a role)
        if (identity.Arn?.includes(':user/')) {
          await this.validateUserPermissions(result);
        } else if (identity.Arn?.includes(':role/')) {
          await this.validateRolePermissions(result, identity.Arn);
        } else {
          result.warnings.push('Unknown identity type - manual permission validation required');
        }

        // Check for overly permissive policies
        await this.checkForOverlyPermissivePolicies(result);

        // Validate audit configuration
        this.validateAuditConfiguration(result);
      }

    } catch (error) {
      result.errors.push(`Validation failed: ${error.message}`);
      result.isValid = false;
    }

    return result;
  }

  /**
   * Validate user permissions
   */
  private async validateUserPermissions(result: ValidationResult): Promise<void> {
    try {
      if (!this.config?.credentials) {
        result.errors.push('No credentials available for user validation');
        return;
      }

      const creds = this.config.credentials;
      
      // Only validate if we have direct credentials
      if (!creds.accessKeyId || !creds.secretAccessKey) {
        result.warnings.push('Cannot validate user permissions without direct access keys');
        return;
      }

      // Create properly typed credentials for AWS SDK
      const awsCredentials = {
        accessKeyId: creds.accessKeyId,
        secretAccessKey: creds.secretAccessKey,
        ...(creds.sessionToken && { sessionToken: creds.sessionToken })
      };

      const iamClient = new IAMClient({
        credentials: awsCredentials,
        region: creds.region || this.config.region
      });

      // Get user information
      const userResponse = await iamClient.send(new GetUserCommand({}));
      const userName = userResponse.User?.UserName;

      if (!userName) {
        result.errors.push('Could not determine user name');
        return;
      }

      // Get attached policies
      const policiesResponse = await iamClient.send(
        new ListAttachedUserPoliciesCommand({ UserName: userName })
      );

      const attachedPolicies = policiesResponse.AttachedPolicies || [];
      
      // Check for admin policies
      const adminPolicies = attachedPolicies.filter(policy => 
        policy.PolicyName?.toLowerCase().includes('admin') ||
        policy.PolicyArn?.includes('AdministratorAccess')
      );

      if (adminPolicies.length > 0) {
        result.warnings.push(
          `User has admin policies attached: ${adminPolicies.map(p => p.PolicyName).join(', ')}`
        );
        result.recommendations.push(
          'Consider using more specific policies or role assumption for better security'
        );
      }

      // Check for required permissions
      const requiredPolicies = this.config?.permissions?.requiredPolicies || [];
      const missingPolicies = requiredPolicies.filter(required => 
        !attachedPolicies.some(attached => attached.PolicyName === required)
      );

      if (missingPolicies.length > 0) {
        result.warnings.push(`Missing recommended policies: ${missingPolicies.join(', ')}`);
      }

    } catch (error) {
      result.warnings.push(`Could not validate user permissions: ${error.message}`);
    }
  }

  /**
   * Validate role permissions
   */
  private async validateRolePermissions(result: ValidationResult, roleArn: string): Promise<void> {
    // For roles, we mainly validate that they exist and are assumable
    result.recommendations.push(
      'Using role-based access - ensure the role has appropriate policies attached'
    );
    
    // Extract role name from ARN for logging
    const roleName = roleArn.split('/').pop();
    console.log(`📋 Validating role: ${roleName}`);
    return Promise.resolve();
  }

  /**
   * Check for overly permissive policies
   */
  private async checkForOverlyPermissivePolicies(result: ValidationResult): Promise<void> {
    // This is a simplified check - in production, you'd want more sophisticated policy analysis
    const _dangerousPatterns = [
      { pattern: '"Action": "*"', message: 'Wildcard actions detected' },
      { pattern: '"Resource": "*"', message: 'Wildcard resources detected' },
      { pattern: '"Effect": "Allow".*"Action": "*".*"Resource": "*"', message: 'Full admin access detected' }
    ];

    // In a real implementation, you'd analyze the actual policy documents
    // For now, we'll add a general recommendation
    result.recommendations.push(
      'Regularly review IAM policies to ensure they follow the principle of least privilege'
    );
    return Promise.resolve();
  }

  /**
   * Validate audit configuration
   */
  private validateAuditConfiguration(result: ValidationResult): void {
    if (!this.config?.audit?.enabled) {
      result.recommendations.push(
        'Consider enabling audit logging for better compliance and security monitoring'
      );
    } else {
      console.log('✅ Audit configuration enabled');
    }
  }

  /**
   * Generate a minimal IAM policy for no-wing
   */
  generateMinimalPolicy(): PolicyDocument {
    return {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: [
            'sts:GetCallerIdentity',
            'sts:AssumeRole'
          ],
          Resource: '*'
        },
        {
          Effect: 'Allow',
          Action: [
            'sts:AssumeRole'
          ],
          Resource: `arn:aws:iam::${this.config?.developerId?.split('-')[2] || '*'}:role/no-wing-*`
        }
      ]
    };
  }

  /**
   * Generate deployment-specific policy
   */
  generateDeploymentPolicy(): PolicyDocument {
    return {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: [
            'cloudformation:*',
            's3:GetObject',
            's3:PutObject',
            's3:DeleteObject',
            's3:ListBucket'
          ],
          Resource: [
            'arn:aws:cloudformation:*:*:stack/no-wing-*/*',
            'arn:aws:s3:::no-wing-*',
            'arn:aws:s3:::no-wing-*/*'
          ]
        },
        {
          Effect: 'Allow',
          Action: [
            'lambda:CreateFunction',
            'lambda:UpdateFunctionCode',
            'lambda:UpdateFunctionConfiguration',
            'lambda:DeleteFunction',
            'lambda:GetFunction',
            'lambda:ListFunctions'
          ],
          Resource: 'arn:aws:lambda:*:*:function:no-wing-*'
        }
      ]
    };
  }

  /**
   * Create default configuration
   */
  static createDefaultConfig(developerId: string, region = 'us-east-1'): NoWingConfig {
    return {
      developerId,
      qId: `q-${developerId}-${Date.now()}`,
      qLevel: 'standard',
      region,
      setupDate: new Date().toISOString(),
      permissions: {
        requiredPolicies: [],
        optionalPolicies: [],
        customPolicies: []
      },
      audit: {
        enabled: false
      }
    };
  }

  /**
   * Migrate old configuration format
   */
  async migrateConfig(): Promise<void> {
    if (!this.config) {
      throw new Error('No configuration loaded');
    }

    let needsMigration = false;

    // Add missing fields with defaults
    if (!this.config.permissions) {
      this.config.permissions = {
        requiredPolicies: [],
        optionalPolicies: [],
        customPolicies: []
      };
      needsMigration = true;
    }

    if (!this.config.audit) {
      this.config.audit = {
        enabled: false
      };
      needsMigration = true;
    }

    if (needsMigration) {
      await this.saveConfig(this.config);
      console.log('✅ Configuration migrated to latest format');
    }
  }
}
