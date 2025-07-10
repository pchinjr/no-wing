import { STSClient, GetCallerIdentityCommand, AssumeRoleCommand } from '@aws-sdk/client-sts';
import { fromIni, fromEnv } from '@aws-sdk/credential-providers';
import * as fs from 'fs';
import * as path from 'path';

export interface CredentialContext {
  type: 'user' | 'no-wing';
  identity?: {
    arn: string;
    userId: string;
    account: string;
  };
  sessionToken?: string;
  expiration?: Date;
}

export interface NoWingCredentialConfig {
  accessKeyId?: string;
  secretAccessKey?: string;
  sessionToken?: string;
  roleArn?: string;
  profile?: string;
  region: string;
}

export class CredentialManager {
  private currentContext: CredentialContext | null = null;
  private userCredentials: any = null;
  private noWingCredentials: any = null;
  private stsClient: STSClient;
  private configPath: string;

  constructor(configPath: string = './.no-wing/config.json') {
    this.configPath = configPath;
    this.stsClient = new STSClient({ region: 'us-east-1' }); // Default region
  }

  /**
   * Initialize credential manager by detecting and validating available credentials
   */
  async initialize(): Promise<void> {
    try {
      // Load user credentials (from environment or AWS config)
      await this.loadUserCredentials();
      
      // Load no-wing credentials from config
      await this.loadNoWingCredentials();
      
      // Set default context to user
      await this.switchToUserContext();
      
      console.log('✅ Credential manager initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize credential manager:', error);
      throw error;
    }
  }

  /**
   * Load user credentials from environment or AWS config
   */
  private async loadUserCredentials(): Promise<void> {
    try {
      // Try environment variables first
      this.userCredentials = fromEnv();
      
      // Validate by getting caller identity
      const tempSTS = new STSClient({ 
        credentials: this.userCredentials,
        region: 'us-east-1'
      });
      
      await tempSTS.send(new GetCallerIdentityCommand({}));
      console.log('✅ User credentials loaded from environment');
    } catch (envError) {
      try {
        // Fall back to AWS config file
        this.userCredentials = fromIni();
        
        const tempSTS = new STSClient({ 
          credentials: this.userCredentials,
          region: 'us-east-1'
        });
        
        await tempSTS.send(new GetCallerIdentityCommand({}));
        console.log('✅ User credentials loaded from AWS config');
      } catch (configError) {
        throw new Error(`Failed to load user credentials: ${configError.message}`);
      }
    }
  }

  /**
   * Load no-wing credentials from configuration
   */
  private async loadNoWingCredentials(): Promise<void> {
    try {
      const configFile = path.resolve(this.configPath);
      
      if (!fs.existsSync(configFile)) {
        throw new Error(`No-wing config file not found: ${configFile}`);
      }

      const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
      const credentialConfig: NoWingCredentialConfig = config.credentials || {};

      if (credentialConfig.profile) {
        // Use AWS profile
        this.noWingCredentials = fromIni({ profile: credentialConfig.profile });
      } else if (credentialConfig.accessKeyId && credentialConfig.secretAccessKey) {
        // Use direct credentials
        this.noWingCredentials = {
          accessKeyId: credentialConfig.accessKeyId,
          secretAccessKey: credentialConfig.secretAccessKey,
          sessionToken: credentialConfig.sessionToken
        };
      } else {
        throw new Error('No valid no-wing credentials found in config');
      }

      // Validate credentials
      const tempSTS = new STSClient({ 
        credentials: this.noWingCredentials,
        region: credentialConfig.region || 'us-east-1'
      });
      
      await tempSTS.send(new GetCallerIdentityCommand({}));
      console.log('✅ No-wing credentials loaded and validated');
    } catch (error) {
      throw new Error(`Failed to load no-wing credentials: ${error.message}`);
    }
  }

  /**
   * Switch to user credential context
   */
  async switchToUserContext(): Promise<CredentialContext> {
    try {
      this.stsClient = new STSClient({ 
        credentials: this.userCredentials,
        region: 'us-east-1'
      });

      const identity = await this.stsClient.send(new GetCallerIdentityCommand({}));
      
      this.currentContext = {
        type: 'user',
        identity: {
          arn: identity.Arn!,
          userId: identity.UserId!,
          account: identity.Account!
        }
      };

      console.log(`🔄 Switched to user context: ${identity.Arn}`);
      return this.currentContext;
    } catch (error) {
      throw new Error(`Failed to switch to user context: ${error.message}`);
    }
  }

  /**
   * Switch to no-wing credential context
   */
  async switchToNoWingContext(): Promise<CredentialContext> {
    try {
      this.stsClient = new STSClient({ 
        credentials: this.noWingCredentials,
        region: 'us-east-1'
      });

      const identity = await this.stsClient.send(new GetCallerIdentityCommand({}));
      
      this.currentContext = {
        type: 'no-wing',
        identity: {
          arn: identity.Arn!,
          userId: identity.UserId!,
          account: identity.Account!
        }
      };

      console.log(`🤖 Switched to no-wing context: ${identity.Arn}`);
      return this.currentContext;
    } catch (error) {
      throw new Error(`Failed to switch to no-wing context: ${error.message}`);
    }
  }

  /**
   * Assume a role using current credentials
   */
  async assumeRole(roleArn: string, sessionName?: string): Promise<CredentialContext> {
    try {
      const command = new AssumeRoleCommand({
        RoleArn: roleArn,
        RoleSessionName: sessionName || `no-wing-session-${Date.now()}`,
        DurationSeconds: 3600 // 1 hour
      });

      const response = await this.stsClient.send(command);
      
      if (!response.Credentials) {
        throw new Error('No credentials returned from assume role');
      }

      // Update STS client with assumed role credentials
      this.stsClient = new STSClient({
        credentials: {
          accessKeyId: response.Credentials.AccessKeyId!,
          secretAccessKey: response.Credentials.SecretAccessKey!,
          sessionToken: response.Credentials.SessionToken!
        },
        region: 'us-east-1'
      });

      // Get identity of assumed role
      const identity = await this.stsClient.send(new GetCallerIdentityCommand({}));

      this.currentContext = {
        type: this.currentContext?.type || 'no-wing',
        identity: {
          arn: identity.Arn!,
          userId: identity.UserId!,
          account: identity.Account!
        },
        sessionToken: response.Credentials.SessionToken!,
        expiration: response.Credentials.Expiration
      };

      console.log(`🎭 Assumed role: ${roleArn}`);
      return this.currentContext;
    } catch (error) {
      throw new Error(`Failed to assume role ${roleArn}: ${error.message}`);
    }
  }

  /**
   * Get current credential context
   */
  getCurrentContext(): CredentialContext | null {
    return this.currentContext;
  }

  /**
   * Get current STS client with active credentials
   */
  getStsClient(): STSClient {
    return this.stsClient;
  }

  /**
   * Get credentials for use with other AWS SDK clients
   */
  getCurrentCredentials(): any {
    if (this.currentContext?.type === 'user') {
      return this.userCredentials;
    } else {
      return this.noWingCredentials;
    }
  }

  /**
   * Validate current credentials are still valid
   */
  async validateCurrentCredentials(): Promise<boolean> {
    try {
      await this.stsClient.send(new GetCallerIdentityCommand({}));
      return true;
    } catch (error) {
      console.warn('⚠️ Current credentials are invalid:', error.message);
      return false;
    }
  }

  /**
   * Get a summary of current credential status
   */
  async getCredentialStatus(): Promise<{
    context: CredentialContext | null;
    isValid: boolean;
    expiresAt?: Date;
  }> {
    const isValid = await this.validateCurrentCredentials();
    
    return {
      context: this.currentContext,
      isValid,
      expiresAt: this.currentContext?.expiration
    };
  }
}
