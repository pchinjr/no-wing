import { SAMManager, SAMDeploymentResult } from './sam-manager';
import { QIdentity } from '../q/identity';

export interface AWSResource {
  type: string;
  name: string;
  arn?: string;
  status: string;
  properties?: Record<string, any>;
}

export interface AWSOperationResult {
  success: boolean;
  resources: AWSResource[];
  metadata?: Record<string, any>;
  errors?: string[];
}

export class AWSServiceManager {
  private region: string;
  private samManager: SAMManager;
  private accountId: string | null = null;

  constructor(region: string = 'us-east-1') {
    this.region = region;
    this.samManager = new SAMManager(region);
  }

  async createLambdaFunction(
    functionName: string,
    description: string,
    qIdentity: QIdentity,
    options: {
      runtime?: string;
      memorySize?: number;
      timeout?: number;
      environment?: string;
    } = {}
  ): Promise<AWSOperationResult> {
    try {
      console.log(`🏗️ Creating Lambda function with SAM: ${functionName}`);
      
      const result = await this.samManager.deployLambdaFunction(
        functionName,
        description,
        qIdentity,
        options
      );

      if (!result.success) {
        return {
          success: false,
          resources: [],
          errors: [result.error || 'SAM deployment failed']
        };
      }

      // Convert SAM resources to our format
      const resources: AWSResource[] = result.resources?.map(resource => ({
        type: resource.type,
        name: resource.name,
        arn: resource.arn,
        status: resource.status,
        properties: {
          runtime: options.runtime || 'nodejs18.x',
          memory: options.memorySize || 256,
          timeout: options.timeout || 30
        }
      })) || [];

      return {
        success: true,
        resources,
        metadata: {
          stackName: result.stackName,
          outputs: result.outputs,
          deploymentMethod: 'SAM'
        }
      };

    } catch (error) {
      console.error('Lambda function creation failed:', error);
      return {
        success: false,
        resources: [],
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  async createS3Bucket(
    bucketName: string,
    qIdentity: QIdentity,
    options: {
      purpose?: string;
      environment?: string;
      enableVersioning?: boolean;
      enableEncryption?: boolean;
    } = {}
  ): Promise<AWSOperationResult> {
    try {
      console.log(`🏗️ Creating S3 bucket with SAM: ${bucketName}`);
      
      const result = await this.samManager.deployS3Bucket(
        bucketName,
        options.purpose || 'General storage bucket',
        qIdentity,
        {
          environment: options.environment,
          enableVersioning: options.enableVersioning,
          enableEncryption: options.enableEncryption
        }
      );

      if (!result.success) {
        return {
          success: false,
          resources: [],
          errors: [result.error || 'SAM deployment failed']
        };
      }

      // Convert SAM resources to our format
      const resources: AWSResource[] = result.resources?.map(resource => ({
        type: resource.type,
        name: resource.name,
        arn: resource.arn,
        status: resource.status,
        properties: {
          versioning: options.enableVersioning,
          encryption: options.enableEncryption !== false,
          purpose: options.purpose
        }
      })) || [];

      return {
        success: true,
        resources,
        metadata: {
          stackName: result.stackName,
          outputs: result.outputs,
          deploymentMethod: 'SAM'
        }
      };

    } catch (error) {
      console.error('S3 bucket creation failed:', error);
      return {
        success: false,
        resources: [],
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  async listLambdaFunctions(): Promise<AWSResource[]> {
    try {
      // List Q-managed stacks instead of individual functions
      const stacks = await this.samManager.listQStacks();
      
      const lambdaStacks = stacks.filter(stack => 
        stack.stackName.includes('lambda') || 
        stack.description?.toLowerCase().includes('lambda')
      );

      return lambdaStacks.map(stack => ({
        type: 'CloudFormation::Stack',
        name: stack.stackName,
        status: stack.status,
        properties: {
          creationTime: stack.creationTime,
          description: stack.description,
          managedBy: 'SAM'
        }
      }));

    } catch (error) {
      console.error('Failed to list Lambda functions:', error);
      return [];
    }
  }

  async listS3Buckets(): Promise<AWSResource[]> {
    try {
      // List Q-managed stacks instead of individual buckets
      const stacks = await this.samManager.listQStacks();
      
      const bucketStacks = stacks.filter(stack => 
        stack.stackName.includes('s3') || 
        stack.stackName.includes('bucket') ||
        stack.description?.toLowerCase().includes('bucket')
      );

      return bucketStacks.map(stack => ({
        type: 'CloudFormation::Stack',
        name: stack.stackName,
        status: stack.status,
        properties: {
          creationTime: stack.creationTime,
          description: stack.description,
          managedBy: 'SAM'
        }
      }));

    } catch (error) {
      console.error('Failed to list S3 buckets:', error);
      return [];
    }
  }

  async deleteStack(stackName: string): Promise<boolean> {
    try {
      return await this.samManager.deleteStack(stackName);
    } catch (error) {
      console.error('Failed to delete stack:', error);
      return false;
    }
  }

  async getAccountId(): Promise<string> {
    if (this.accountId) {
      return this.accountId;
    }

    try {
      // This would use STS in a real implementation
      // For now, return a placeholder
      this.accountId = process.env.AWS_ACCOUNT_ID || '123456789012';
      return this.accountId;
    } catch (error) {
      console.warn('Could not get AWS account ID');
      return '123456789012';
    }
  }
}
