import { S3Client } from '@aws-sdk/client-s3';
import { CloudFormationClient } from '@aws-sdk/client-cloudformation';
import { LambdaClient } from '@aws-sdk/client-lambda';
import { IAMClient } from '@aws-sdk/client-iam';
import { STSClient } from '@aws-sdk/client-sts';
import { CredentialManager } from './CredentialManager.ts';

// Use the same type definition as CredentialManager
export type AwsCredentialIdentity = {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  expiration?: Date;
};

export type AWSServiceType = 's3' | 'cloudformation' | 'lambda' | 'iam' | 'sts';

export interface ClientConfig {
  region?: string;
  maxAttempts?: number;
  requestTimeout?: number;
}

export class AWSClientFactory {
  private credentialManager: CredentialManager;
  private clientCache: Map<string, unknown> = new Map();
  private defaultRegion: string;

  constructor(credentialManager: CredentialManager, defaultRegion: string = 'us-east-1') {
    this.credentialManager = credentialManager;
    this.defaultRegion = defaultRegion;
  }

  /**
   * Get an AWS service client with current credentials
   */
  async getClient<T>(
    serviceType: AWSServiceType, 
    config: ClientConfig = {}
  ): Promise<T> {
    const context = this.credentialManager.getCurrentContext();
    if (!context) {
      throw new Error('No credential context available. Call credentialManager.initialize() first.');
    }

    const cacheKey = `${serviceType}-${context.type}-${config.region || this.defaultRegion}`;
    
    // Check cache first
    if (this.clientCache.has(cacheKey)) {
      const cachedClient = this.clientCache.get(cacheKey);
      
      // Validate cached client is still valid
      if (await this.isClientValid(cachedClient, serviceType)) {
        return cachedClient as T;
      } else {
        // Remove invalid client from cache
        this.clientCache.delete(cacheKey);
      }
    }

    // Create new client
    const client = await this.createClient(serviceType, config);
    
    // Cache the client
    this.clientCache.set(cacheKey, client);
    
    return client as T;
  }

  /**
   * Create a new AWS service client
   */
  private createClient(serviceType: AWSServiceType, config: ClientConfig): unknown {
    const credentials = this.credentialManager.getCurrentCredentialProvider();
    const region = config.region || this.defaultRegion;
    
    const clientConfig = {
      ...(credentials && { credentials }),
      region,
      maxAttempts: config.maxAttempts || 3,
      requestTimeout: config.requestTimeout || 30000
    };

    switch (serviceType) {
      case 's3':
        return new S3Client(clientConfig);
      
      case 'cloudformation':
        return new CloudFormationClient(clientConfig);
      
      case 'lambda':
        return new LambdaClient(clientConfig);
      
      case 'iam':
        return new IAMClient(clientConfig);
      
      case 'sts':
        return new STSClient(clientConfig);
      
      default:
        throw new Error(`Unsupported service type: ${serviceType}`);
    }
  }

  /**
   * Validate that a cached client is still valid
   */
  private async isClientValid(client: unknown, serviceType: AWSServiceType): Promise<boolean> {
    try {
      // Simple validation call for each service type
      switch (serviceType) {
        case 's3':
          await (client as any).send(new (await import('@aws-sdk/client-s3')).ListBucketsCommand({}));
          break;
        
        case 'cloudformation':
          await (client as any).send(new (await import('@aws-sdk/client-cloudformation')).ListStacksCommand({ StackStatusFilter: ['CREATE_COMPLETE'] }));
          break;
        
        case 'lambda':
          await (client as any).send(new (await import('@aws-sdk/client-lambda')).ListFunctionsCommand({ MaxItems: 1 }));
          break;
        
        case 'iam':
          await (client as any).send(new (await import('@aws-sdk/client-iam')).GetUserCommand({}));
          break;
        
        case 'sts':
          await (client as any).send(new (await import('@aws-sdk/client-sts')).GetCallerIdentityCommand({}));
          break;
        
        default:
          return false;
      }
      
      return true;
    } catch (error) {
      console.warn(`⚠️ Client validation failed for ${serviceType}:`, error.message);
      return false;
    }
  }

  /**
   * Clear all cached clients (useful when credentials change)
   */
  clearCache(): void {
    this.clientCache.clear();
    console.log('🧹 AWS client cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    keys: string[];
  } {
    return {
      size: this.clientCache.size,
      keys: Array.from(this.clientCache.keys())
    };
  }

  /**
   * Create a client with specific credentials (bypass credential manager)
   */
  createClientWithCredentials<T>(
    serviceType: AWSServiceType,
    credentials: AwsCredentialIdentity,
    config: ClientConfig = {}
  ): Promise<T> {
    const region = config.region || this.defaultRegion;
    
    const clientConfig = {
      credentials,
      region,
      maxAttempts: config.maxAttempts || 3,
      requestTimeout: config.requestTimeout || 30000
    };

    switch (serviceType) {
      case 's3':
        return Promise.resolve(new S3Client(clientConfig) as T);
      
      case 'cloudformation':
        return Promise.resolve(new CloudFormationClient(clientConfig) as T);
      
      case 'lambda':
        return Promise.resolve(new LambdaClient(clientConfig) as T);
      
      case 'iam':
        return Promise.resolve(new IAMClient(clientConfig) as T);
      
      case 'sts':
        return Promise.resolve(new STSClient(clientConfig) as T);
      
      default:
        throw new Error(`Unsupported service type: ${serviceType}`);
    }
  }

  /**
   * Helper method to get commonly used clients
   */
  getS3Client(config?: ClientConfig): Promise<S3Client> {
    return this.getClient<S3Client>('s3', config);
  }

  getCloudFormationClient(config?: ClientConfig): Promise<CloudFormationClient> {
    return this.getClient<CloudFormationClient>('cloudformation', config);
  }

  getLambdaClient(config?: ClientConfig): Promise<LambdaClient> {
    return this.getClient<LambdaClient>('lambda', config);
  }

  getIAMClient(config?: ClientConfig): Promise<IAMClient> {
    return this.getClient<IAMClient>('iam', config);
  }

  getSTSClient(config?: ClientConfig): Promise<STSClient> {
    return this.getClient<STSClient>('sts', config);
  }

  /**
   * Execute a function with a specific credential context
   */
  async withContext<T>(
    contextType: 'user' | 'no-wing',
    operation: () => Promise<T>
  ): Promise<T> {
    const originalContext = this.credentialManager.getCurrentContext();
    
    try {
      // Switch to requested context
      if (contextType === 'user') {
        await this.credentialManager.switchToUserContext();
      } else {
        await this.credentialManager.switchToNoWingContext();
      }
      
      // Clear cache since credentials changed
      this.clearCache();
      
      // Execute operation
      const result = await operation();
      
      return result;
    } finally {
      // Restore original context
      if (originalContext) {
        if (originalContext.type === 'user') {
          await this.credentialManager.switchToUserContext();
        } else {
          await this.credentialManager.switchToNoWingContext();
        }
        this.clearCache();
      }
    }
  }

  /**
   * Execute a deployment operation with no-wing credentials
   */
  executeAsNoWing<T>(operation: () => Promise<T>): Promise<T> {
    return this.withContext('no-wing', operation);
  }

  /**
   * Execute a user operation with user credentials
   */
  executeAsUser<T>(operation: () => Promise<T>): Promise<T> {
    return this.withContext('user', operation);
  }
}
