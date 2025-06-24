import { 
  LambdaClient, 
  CreateFunctionCommand, 
  UpdateFunctionConfigurationCommand,
  GetFunctionCommand,
  ListFunctionsCommand,
  DeleteFunctionCommand,
  CreateFunctionCommandInput
} from '@aws-sdk/client-lambda';
import { 
  IAMClient, 
  CreateRoleCommand, 
  AttachRolePolicyCommand,
  GetRoleCommand,
  ListRolesCommand
} from '@aws-sdk/client-iam';
import { 
  S3Client, 
  CreateBucketCommand, 
  PutBucketPolicyCommand,
  ListBucketsCommand,
  GetBucketLocationCommand
} from '@aws-sdk/client-s3';
import { 
  CloudWatchLogsClient, 
  CreateLogGroupCommand,
  DescribeLogGroupsCommand
} from '@aws-sdk/client-cloudwatch-logs';
import { 
  STSClient, 
  GetCallerIdentityCommand 
} from '@aws-sdk/client-sts';
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
  errors?: string[];
  metadata?: Record<string, any>;
}

export class AWSServiceManager {
  private lambdaClient: LambdaClient;
  private iamClient: IAMClient;
  private s3Client: S3Client;
  private logsClient: CloudWatchLogsClient;
  private stsClient: STSClient;
  private region: string;
  private accountId?: string;

  constructor(region: string = 'us-east-1') {
    this.region = region;
    this.lambdaClient = new LambdaClient({ region });
    this.iamClient = new IAMClient({ region });
    this.s3Client = new S3Client({ region });
    this.logsClient = new CloudWatchLogsClient({ region });
    this.stsClient = new STSClient({ region });
  }

  /**
   * Get current AWS account ID
   */
  async getAccountId(): Promise<string> {
    if (!this.accountId) {
      try {
        const command = new GetCallerIdentityCommand({});
        const response = await this.stsClient.send(command);
        this.accountId = response.Account || '';
      } catch (error) {
        console.error('Failed to get account ID:', error);
        throw error;
      }
    }
    return this.accountId;
  }

  /**
   * Create a Lambda function with IAM role
   */
  async createLambdaFunction(
    functionName: string, 
    description: string,
    qIdentity: QIdentity
  ): Promise<AWSOperationResult> {
    const resources: AWSResource[] = [];
    const errors: string[] = [];

    try {
      const accountId = await this.getAccountId();
      
      // 1. Create IAM role for the Lambda function
      const roleName = `${functionName}-role`;
      const roleArn = await this.createLambdaExecutionRole(roleName, qIdentity);
      
      resources.push({
        type: 'IAM::Role',
        name: roleName,
        arn: roleArn,
        status: 'Created'
      });

      // 2. Create CloudWatch Log Group
      const logGroupName = `/aws/lambda/${functionName}`;
      await this.createLogGroup(logGroupName);
      
      resources.push({
        type: 'CloudWatchLogs::LogGroup',
        name: logGroupName,
        status: 'Created'
      });

      // 3. Create Lambda function
      const functionCode = this.generateBasicLambdaCode(functionName, description);
      const zipBuffer = await this.createDeploymentPackage(functionCode);

      const createFunctionParams: CreateFunctionCommandInput = {
        FunctionName: functionName,
        Runtime: 'nodejs18.x',
        Role: roleArn,
        Handler: 'index.handler',
        Code: {
          ZipFile: zipBuffer
        },
        Description: description,
        Timeout: 30,
        MemorySize: 256,
        Environment: {
          Variables: {
            NODE_ENV: 'production',
            LOG_LEVEL: 'info',
            CREATED_BY: `Q-${qIdentity.id}`
          }
        },
        Tags: {
          'CreatedBy': `Q-${qIdentity.id}`,
          'NoWingComponent': 'q-created-function',
          'Environment': process.env.NODE_ENV || 'dev'
        }
      };

      const createCommand = new CreateFunctionCommand(createFunctionParams);
      
      // Retry Lambda creation with exponential backoff for IAM propagation
      let functionResponse;
      let retries = 0;
      const maxRetries = 3;
      
      while (retries < maxRetries) {
        try {
          functionResponse = await this.lambdaClient.send(createCommand);
          break;
        } catch (error: any) {
          if (error.name === 'InvalidParameterValueException' && 
              error.message.includes('cannot be assumed by Lambda') && 
              retries < maxRetries - 1) {
            console.log(`⏳ IAM role not ready, retrying in ${(retries + 1) * 5} seconds...`);
            await new Promise(resolve => setTimeout(resolve, (retries + 1) * 5000));
            retries++;
          } else {
            throw error;
          }
        }
      }

      if (!functionResponse) {
        throw new Error('Failed to create Lambda function after retries');
      }

      resources.push({
        type: 'Lambda::Function',
        name: functionName,
        arn: functionResponse.FunctionArn,
        status: 'Created',
        properties: {
          runtime: functionResponse.Runtime,
          memory: functionResponse.MemorySize,
          timeout: functionResponse.Timeout
        }
      });

      return {
        success: true,
        resources,
        metadata: {
          functionArn: functionResponse.FunctionArn,
          roleArn,
          logGroupName
        }
      };

    } catch (error) {
      console.error('Failed to create Lambda function:', error);
      errors.push(`Lambda creation failed: ${error}`);
      
      return {
        success: false,
        resources,
        errors
      };
    }
  }

  /**
   * Update Lambda function configuration
   */
  async updateLambdaFunction(
    functionName: string,
    updates: {
      memory?: number;
      timeout?: number;
      environment?: Record<string, string>;
    }
  ): Promise<AWSOperationResult> {
    try {
      const updateParams: any = {
        FunctionName: functionName
      };

      if (updates.memory) {
        updateParams.MemorySize = updates.memory;
      }
      if (updates.timeout) {
        updateParams.Timeout = updates.timeout;
      }
      if (updates.environment) {
        updateParams.Environment = {
          Variables: updates.environment
        };
      }

      const command = new UpdateFunctionConfigurationCommand(updateParams);
      const response = await this.lambdaClient.send(command);

      return {
        success: true,
        resources: [{
          type: 'Lambda::Function',
          name: functionName,
          arn: response.FunctionArn,
          status: 'Updated',
          properties: {
            memory: response.MemorySize,
            timeout: response.Timeout
          }
        }]
      };

    } catch (error) {
      console.error('Failed to update Lambda function:', error);
      return {
        success: false,
        resources: [],
        errors: [`Update failed: ${error}`]
      };
    }
  }

  /**
   * List Lambda functions
   */
  async listLambdaFunctions(): Promise<AWSResource[]> {
    try {
      const command = new ListFunctionsCommand({});
      const response = await this.lambdaClient.send(command);

      return (response.Functions || []).map(func => ({
        type: 'Lambda::Function',
        name: func.FunctionName || '',
        arn: func.FunctionArn,
        status: func.State || 'Unknown',
        properties: {
          runtime: func.Runtime,
          memory: func.MemorySize,
          timeout: func.Timeout,
          lastModified: func.LastModified
        }
      }));

    } catch (error) {
      console.error('Failed to list Lambda functions:', error);
      return [];
    }
  }

  /**
   * Create S3 bucket
   */
  async createS3Bucket(
    bucketName: string,
    qIdentity: QIdentity
  ): Promise<AWSOperationResult> {
    try {
      const accountId = await this.getAccountId();
      const fullBucketName = `${bucketName}-${accountId}-${this.region}`;

      const createCommand = new CreateBucketCommand({
        Bucket: fullBucketName,
        CreateBucketConfiguration: this.region !== 'us-east-1' ? {
          LocationConstraint: this.region as any
        } : undefined
      });

      await this.s3Client.send(createCommand);

      // Apply basic bucket policy
      const bucketPolicy = {
        Version: '2012-10-17',
        Statement: [{
          Sid: 'NoWingQAccess',
          Effect: 'Allow',
          Principal: {
            AWS: `arn:aws:iam::${accountId}:role/NoWingQ*`
          },
          Action: [
            's3:GetObject',
            's3:PutObject',
            's3:DeleteObject'
          ],
          Resource: `arn:aws:s3:::${fullBucketName}/*`
        }]
      };

      const policyCommand = new PutBucketPolicyCommand({
        Bucket: fullBucketName,
        Policy: JSON.stringify(bucketPolicy)
      });

      await this.s3Client.send(policyCommand);

      return {
        success: true,
        resources: [{
          type: 'S3::Bucket',
          name: fullBucketName,
          arn: `arn:aws:s3:::${fullBucketName}`,
          status: 'Created',
          properties: {
            region: this.region,
            createdBy: `Q-${qIdentity.id}`
          }
        }]
      };

    } catch (error) {
      console.error('Failed to create S3 bucket:', error);
      return {
        success: false,
        resources: [],
        errors: [`S3 bucket creation failed: ${error}`]
      };
    }
  }

  /**
   * Create IAM role for Lambda execution
   */
  private async createLambdaExecutionRole(
    roleName: string,
    qIdentity: QIdentity
  ): Promise<string> {
    const accountId = await this.getAccountId();
    
    const assumeRolePolicy = {
      Version: '2012-10-17',
      Statement: [{
        Effect: 'Allow',
        Principal: {
          Service: 'lambda.amazonaws.com'
        },
        Action: 'sts:AssumeRole'
      }]
    };

    const createRoleCommand = new CreateRoleCommand({
      RoleName: roleName,
      AssumeRolePolicyDocument: JSON.stringify(assumeRolePolicy),
      Description: `Lambda execution role created by Q-${qIdentity.id}`,
      Tags: [{
        Key: 'CreatedBy',
        Value: `Q-${qIdentity.id}`
      }, {
        Key: 'NoWingComponent',
        Value: 'q-created-role'
      }]
    });

    const roleResponse = await this.iamClient.send(createRoleCommand);

    // Attach basic Lambda execution policy
    const attachPolicyCommand = new AttachRolePolicyCommand({
      RoleName: roleName,
      PolicyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
    });

    await this.iamClient.send(attachPolicyCommand);

    // Wait for IAM role propagation
    console.log('⏳ Waiting for IAM role propagation...');
    await new Promise(resolve => setTimeout(resolve, 10000)); // 10 second delay

    return roleResponse.Role?.Arn || '';
  }

  /**
   * Create CloudWatch Log Group
   */
  private async createLogGroup(logGroupName: string): Promise<void> {
    try {
      const command = new CreateLogGroupCommand({
        logGroupName,
        tags: {
          'NoWingComponent': 'q-created-logs',
          'CreatedBy': 'Q-Agent'
        }
      });

      await this.logsClient.send(command);
    } catch (error: any) {
      // Ignore if log group already exists
      if (error.name !== 'ResourceAlreadyExistsException') {
        throw error;
      }
    }
  }

  /**
   * Generate basic Lambda function code
   */
  private generateBasicLambdaCode(functionName: string, description: string): string {
    return `
// ${functionName}
// ${description}
// Created by no-wing Q Agent

exports.handler = async (event, context) => {
    console.log('Event:', JSON.stringify(event, null, 2));
    
    try {
        // Basic function logic
        const response = {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'X-Created-By': 'no-wing-q-agent'
            },
            body: JSON.stringify({
                message: 'Function created successfully by Q',
                functionName: '${functionName}',
                timestamp: new Date().toISOString(),
                event: event
            })
        };
        
        return response;
        
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Internal server error',
                message: error.message
            })
        };
    }
};
`.trim();
  }

  /**
   * Create deployment package (ZIP) for Lambda
   */
  private async createDeploymentPackage(code: string): Promise<Buffer> {
    // For now, create a simple ZIP with just the index.js file
    // In production, you might want to use a proper ZIP library
    const JSZip = require('jszip');
    const zip = new JSZip();
    
    zip.file('index.js', code);
    
    return await zip.generateAsync({ type: 'nodebuffer' });
  }
}
