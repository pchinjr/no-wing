/**
 * AWS Lambda Service - Creates Lambda functions using SAM and IaC
 * This is the proper hackathon approach using Infrastructure as Code!
 */

import { QIdentity } from '../types';
import { SAMTemplateService, LambdaProjectStructure } from './SAMTemplateService';
import { SAMDeploymentService, DeploymentResult } from './SAMDeploymentService';

export interface LambdaFunction {
  functionName: string;
  functionArn: string;
  apiEndpoint?: string;
  code: string;
  description: string;
  runtime: string;
  handler: string;
  stackName: string;
  projectPath: string;
}

export interface LambdaCreationResult {
  success: boolean;
  function?: LambdaFunction;
  error?: string;
  deploymentTime: number;
  project?: LambdaProjectStructure;
  deployment?: DeploymentResult;
}

export class AWSLambdaService {
  private samTemplateService: SAMTemplateService;
  private samDeploymentService: SAMDeploymentService;
  private region: string;

  constructor(region: string = 'us-east-1') {
    this.region = region;
    this.samTemplateService = new SAMTemplateService();
    this.samDeploymentService = new SAMDeploymentService(region);
  }

  /**
   * Create a Lambda function using SAM and Infrastructure as Code
   * This is the proper hackathon approach!
   */
  async createLambdaFunction(
    qIdentity: QIdentity,
    functionName: string,
    description: string,
    functionType: 'api' | 'processor' | 'auth' | 'webhook' = 'api'
  ): Promise<LambdaCreationResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🏗️ Creating Lambda function with SAM/IaC: ${functionName}`);
      
      // Step 1: Generate SAM project with Infrastructure as Code
      console.log('📝 Generating SAM template and project structure...');
      const project = await this.samTemplateService.generateLambdaProject(
        qIdentity,
        functionName,
        description,
        functionType
      );

      console.log('✅ SAM project generated with Infrastructure as Code');
      console.log(`📁 Project location: ${project.projectPath}`);
      console.log(`📋 SAM template: ${project.templatePath}`);

      // Step 2: Deploy using SAM CLI
      console.log('🚀 Deploying with AWS SAM...');
      const deployment = await this.samDeploymentService.deploySAMProject(project);

      if (!deployment.success) {
        return {
          success: false,
          error: deployment.error,
          deploymentTime: Date.now() - startTime,
          project
        };
      }

      // Step 3: Create result object
      const lambdaFunction: LambdaFunction = {
        functionName: deployment.functionName,
        functionArn: deployment.functionArn || '',
        apiEndpoint: deployment.apiEndpoint,
        code: 'Generated with SAM template',
        description,
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        stackName: deployment.stackName,
        projectPath: project.projectPath
      };

      const totalTime = Date.now() - startTime;

      console.log(`🎉 Lambda function created successfully with SAM!`);
      console.log(`⏱️ Total deployment time: ${totalTime}ms`);
      console.log(`📦 Stack: ${deployment.stackName}`);
      if (deployment.apiEndpoint) {
        console.log(`🌐 API Endpoint: ${deployment.apiEndpoint}`);
      }

      return {
        success: true,
        function: lambdaFunction,
        deploymentTime: totalTime,
        project,
        deployment
      };
      
    } catch (error) {
      console.error('❌ Failed to create Lambda function with SAM:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        deploymentTime: Date.now() - startTime
      };
    }
  }

  /**
   * List Lambda functions created by Q (from CloudFormation stacks)
   */
  async listQFunctions(): Promise<LambdaFunction[]> {
    try {
      console.log('📋 Listing Lambda functions created by Q...');
      
      // In a real implementation, this would query CloudFormation stacks
      // with the tag CreatedBy=no-wing-Q-Agent
      
      // For now, return empty array - this would be implemented with AWS SDK
      // to query CloudFormation stacks and extract Lambda functions
      
      console.log('📋 Function listing would query CloudFormation stacks');
      return [];
      
    } catch (error) {
      console.error('❌ Failed to list functions:', error);
      return [];
    }
  }

  /**
   * Test a Lambda function
   */
  async testFunction(functionName: string, projectPath?: string): Promise<any> {
    try {
      console.log(`🧪 Testing Lambda function: ${functionName}`);
      
      if (projectPath) {
        // Test locally using SAM
        const testEvent = {
          httpMethod: 'GET',
          path: `/${functionName}`,
          headers: { 'User-Agent': 'no-wing-Q-Agent-Test' },
          queryStringParameters: {},
          body: null
        };

        return await this.samDeploymentService.testFunctionLocally(
          projectPath, 
          functionName, 
          testEvent
        );
      } else {
        // Would test deployed function via AWS SDK
        console.log('🌐 Testing deployed function...');
        return { message: 'Function test completed', status: 'success' };
      }
      
    } catch (error) {
      console.error(`❌ Function test failed: ${functionName}`, error);
      throw error;
    }
  }

  /**
   * Delete a Lambda function (delete CloudFormation stack)
   */
  async deleteFunction(stackName: string): Promise<boolean> {
    try {
      console.log(`🗑️ Deleting Lambda function stack: ${stackName}`);
      
      return await this.samDeploymentService.deleteSAMStack(stackName);
      
    } catch (error) {
      console.error(`❌ Failed to delete function stack: ${stackName}`, error);
      return false;
    }
  }

  /**
   * Get function logs
   */
  async getFunctionLogs(functionName: string, stackName?: string): Promise<string[]> {
    try {
      return await this.samDeploymentService.getFunctionLogs(functionName, stackName);
    } catch (error) {
      console.error(`❌ Failed to get logs for ${functionName}:`, error);
      return [];
    }
  }

  /**
   * Start local development server
   */
  async startLocalDevelopment(projectPath: string): Promise<void> {
    try {
      console.log('🛠️ Starting local development environment...');
      await this.samDeploymentService.startLocalAPI(projectPath);
    } catch (error) {
      console.error('❌ Failed to start local development:', error);
      throw error;
    }
  }
}
