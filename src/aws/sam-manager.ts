import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { QIdentity } from '../q/identity';

const execAsync = promisify(exec);

export interface SAMDeploymentResult {
  success: boolean;
  stackName: string;
  outputs?: Record<string, string>;
  resources?: Array<{
    type: string;
    name: string;
    arn?: string;
    status: string;
  }>;
  error?: string;
}

export class SAMManager {
  private region: string;
  private templatesDir: string;
  private deploymentDir: string;

  constructor(region: string = 'us-east-1') {
    this.region = region;
    this.templatesDir = join(process.cwd(), 'templates');
    this.deploymentDir = join(process.cwd(), '.no-wing', 'deployments');
    
    // Ensure deployment directory exists
    if (!existsSync(this.deploymentDir)) {
      mkdirSync(this.deploymentDir, { recursive: true });
    }
  }

  async deployLambdaFunction(
    functionName: string,
    description: string,
    qIdentity: QIdentity,
    options: {
      runtime?: string;
      memorySize?: number;
      timeout?: number;
      environment?: string;
    } = {}
  ): Promise<SAMDeploymentResult> {
    try {
      const stackName = `q-${functionName}-${Date.now().toString().slice(-6)}`;
      const templatePath = join(this.templatesDir, 'q-lambda-function.yaml');
      
      if (!existsSync(templatePath)) {
        throw new Error(`SAM template not found: ${templatePath}`);
      }

      // Create parameter overrides
      const parameters = [
        `FunctionName=${stackName}`,
        `FunctionDescription=${description}`,
        `Runtime=${options.runtime || 'nodejs18.x'}`,
        `MemorySize=${options.memorySize || 256}`,
        `Timeout=${options.timeout || 30}`,
        `Environment=${options.environment || 'dev'}`,
        `QIdentity=${qIdentity.id}`
      ];

      console.log(`🏗️ Deploying Lambda function with SAM: ${stackName}`);
      
      // Build the SAM application
      await this.samBuild(templatePath);
      
      // Deploy the SAM application
      const deployResult = await this.samDeploy(stackName, parameters);
      
      // Get stack outputs
      const outputs = await this.getStackOutputs(stackName);
      
      // Get stack resources
      const resources = await this.getStackResources(stackName);
      
      return {
        success: true,
        stackName,
        outputs,
        resources,
      };
      
    } catch (error) {
      console.error('SAM deployment failed:', error);
      return {
        success: false,
        stackName: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async deployS3Bucket(
    bucketName: string,
    purpose: string,
    qIdentity: QIdentity,
    options: {
      environment?: string;
      enableVersioning?: boolean;
      enableEncryption?: boolean;
    } = {}
  ): Promise<SAMDeploymentResult> {
    try {
      const stackName = `q-${bucketName}-${Date.now().toString().slice(-6)}`;
      const templatePath = join(this.templatesDir, 'q-s3-bucket.yaml');
      
      if (!existsSync(templatePath)) {
        throw new Error(`SAM template not found: ${templatePath}`);
      }

      // Create parameter overrides
      const parameters = [
        `BucketName=${bucketName}`,
        `BucketPurpose=${purpose}`,
        `Environment=${options.environment || 'dev'}`,
        `QIdentity=${qIdentity.id}`,
        `EnableVersioning=${options.enableVersioning ? 'true' : 'false'}`,
        `EnableEncryption=${options.enableEncryption !== false ? 'true' : 'false'}`
      ];

      console.log(`🏗️ Deploying S3 bucket with SAM: ${stackName}`);
      
      // Build the SAM application
      await this.samBuild(templatePath);
      
      // Deploy the SAM application
      const deployResult = await this.samDeploy(stackName, parameters);
      
      // Get stack outputs
      const outputs = await this.getStackOutputs(stackName);
      
      // Get stack resources
      const resources = await this.getStackResources(stackName);
      
      return {
        success: true,
        stackName,
        outputs,
        resources,
      };
      
    } catch (error) {
      console.error('SAM deployment failed:', error);
      return {
        success: false,
        stackName: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async samBuild(templatePath: string): Promise<void> {
    const buildDir = join(this.deploymentDir, 'build');
    
    // Try without container first (faster for development)
    let buildCommand = [
      'sam build',
      `--template-file ${templatePath}`,
      `--build-dir ${buildDir}`
    ].join(' ');

    console.log(`🔨 Building SAM application...`);
    
    try {
      const { stdout, stderr } = await execAsync(buildCommand);
      
      if (stderr && !stderr.includes('Successfully built')) {
        console.warn('SAM build warnings:', stderr);
      }
      
      console.log('✅ SAM build completed');
    } catch (error) {
      // If regular build fails, try with container
      console.log('🐳 Trying SAM build with container...');
      
      buildCommand = [
        'sam build',
        `--template-file ${templatePath}`,
        `--build-dir ${buildDir}`,
        '--use-container'
      ].join(' ');
      
      try {
        const { stdout, stderr } = await execAsync(buildCommand);
        console.log('✅ SAM build completed with container');
      } catch (containerError) {
        throw new Error(`SAM build failed: ${containerError}`);
      }
    }
  }

  private async samDeploy(stackName: string, parameters: string[]): Promise<void> {
    const buildDir = join(this.deploymentDir, 'build');
    const parameterOverrides = parameters.join(' ');
    
    const deployCommand = [
      'sam deploy',
      `--template-file ${join(buildDir, 'template.yaml')}`,
      `--stack-name ${stackName}`,
      `--parameter-overrides ${parameterOverrides}`,
      '--capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM',
      '--no-confirm-changeset',
      '--no-fail-on-empty-changeset',
      `--region ${this.region}`,
      '--tags CreatedBy=Q-Agent ManagedBy=no-wing'
    ].join(' ');

    console.log(`🚀 Deploying SAM stack: ${stackName}`);
    const { stdout, stderr } = await execAsync(deployCommand);
    
    if (stderr && !stderr.includes('Successfully created/updated stack')) {
      console.warn('SAM deploy warnings:', stderr);
    }
    
    console.log('✅ SAM deployment completed');
  }

  private async getStackOutputs(stackName: string): Promise<Record<string, string>> {
    try {
      const command = `aws cloudformation describe-stacks --stack-name ${stackName} --region ${this.region} --query 'Stacks[0].Outputs' --output json`;
      const { stdout } = await execAsync(command);
      
      const outputs = JSON.parse(stdout) || [];
      const outputMap: Record<string, string> = {};
      
      outputs.forEach((output: any) => {
        outputMap[output.OutputKey] = output.OutputValue;
      });
      
      return outputMap;
    } catch (error) {
      console.warn('Failed to get stack outputs:', error);
      return {};
    }
  }

  private async getStackResources(stackName: string): Promise<Array<{
    type: string;
    name: string;
    arn?: string;
    status: string;
  }>> {
    try {
      const command = `aws cloudformation describe-stack-resources --stack-name ${stackName} --region ${this.region} --query 'StackResources' --output json`;
      const { stdout } = await execAsync(command);
      
      const resources = JSON.parse(stdout) || [];
      
      return resources.map((resource: any) => ({
        type: resource.ResourceType,
        name: resource.LogicalResourceId,
        arn: resource.PhysicalResourceId,
        status: resource.ResourceStatus
      }));
    } catch (error) {
      console.warn('Failed to get stack resources:', error);
      return [];
    }
  }

  async deleteStack(stackName: string): Promise<boolean> {
    try {
      console.log(`🗑️ Deleting SAM stack: ${stackName}`);
      
      const command = `aws cloudformation delete-stack --stack-name ${stackName} --region ${this.region}`;
      await execAsync(command);
      
      console.log('✅ Stack deletion initiated');
      return true;
    } catch (error) {
      console.error('Failed to delete stack:', error);
      return false;
    }
  }

  async listQStacks(): Promise<Array<{
    stackName: string;
    status: string;
    creationTime: string;
    description?: string;
  }>> {
    try {
      const command = `aws cloudformation describe-stacks --region ${this.region} --query 'Stacks[?starts_with(StackName, \`q-\`)]' --output json`;
      const { stdout } = await execAsync(command);
      
      const stacks = JSON.parse(stdout) || [];
      
      return stacks.map((stack: any) => ({
        stackName: stack.StackName,
        status: stack.StackStatus,
        creationTime: stack.CreationTime,
        description: stack.Description
      }));
    } catch (error) {
      console.warn('Failed to list Q stacks:', error);
      return [];
    }
  }
}
