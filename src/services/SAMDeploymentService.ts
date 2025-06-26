/**
 * SAM Deployment Service - Deploys Infrastructure as Code
 * Uses AWS SAM CLI for proper Lambda deployment
 */

import { execSync, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { LambdaProjectStructure } from './SAMTemplateService';

export interface DeploymentResult {
  success: boolean;
  functionName: string;
  functionArn?: string;
  apiEndpoint?: string;
  stackName: string;
  deploymentTime: number;
  outputs?: Record<string, string>;
  error?: string;
}

export class SAMDeploymentService {
  private region: string;

  constructor(region: string = 'us-east-1') {
    this.region = region;
  }

  /**
   * Deploy SAM project to AWS
   */
  async deploySAMProject(project: LambdaProjectStructure): Promise<DeploymentResult> {
    const startTime = Date.now();
    const stackName = `no-wing-${project.functionName.toLowerCase()}-${Date.now()}`;

    try {
      console.log(`🚀 Deploying SAM project: ${project.functionName}`);
      console.log(`📁 Project path: ${project.projectPath}`);

      // Check if SAM CLI is available
      await this.checkSAMCLI();

      // Build the SAM project
      console.log('🔨 Building SAM project...');
      await this.samBuild(project.projectPath);

      // Deploy the SAM project
      console.log('🚀 Deploying to AWS...');
      const deployOutput = await this.samDeploy(project.projectPath, stackName);

      // Get stack outputs
      const outputs = await this.getStackOutputs(stackName);

      const deploymentTime = Date.now() - startTime;

      console.log(`✅ Deployment completed in ${deploymentTime}ms`);

      return {
        success: true,
        functionName: project.functionName,
        functionArn: outputs.FunctionArn || outputs[`${project.functionName}Arn`],
        apiEndpoint: outputs.ApiUrl,
        stackName,
        deploymentTime,
        outputs
      };

    } catch (error) {
      console.error('❌ SAM deployment failed:', error);
      
      return {
        success: false,
        functionName: project.functionName,
        stackName,
        deploymentTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown deployment error'
      };
    }
  }

  /**
   * Check if SAM CLI is installed
   */
  private async checkSAMCLI(): Promise<void> {
    try {
      execSync('sam --version', { stdio: 'pipe' });
      console.log('✅ SAM CLI is available');
    } catch (error) {
      throw new Error('SAM CLI is not installed. Please install AWS SAM CLI: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html');
    }
  }

  /**
   * Build SAM project
   */
  private async samBuild(projectPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const buildCommand = 'sam build';
      
      console.log(`🔨 Running: ${buildCommand}`);
      
      const buildProcess = spawn('sam', ['build'], {
        cwd: projectPath,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      buildProcess.stdout.on('data', (data) => {
        stdout += data.toString();
        console.log(data.toString().trim());
      });

      buildProcess.stderr.on('data', (data) => {
        stderr += data.toString();
        console.error(data.toString().trim());
      });

      buildProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ SAM build completed successfully');
          resolve();
        } else {
          reject(new Error(`SAM build failed with code ${code}: ${stderr}`));
        }
      });

      buildProcess.on('error', (error) => {
        reject(new Error(`SAM build process error: ${error.message}`));
      });
    });
  }

  /**
   * Deploy SAM project
   */
  private async samDeploy(projectPath: string, stackName: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const deployArgs = [
        'deploy',
        '--stack-name', stackName,
        '--region', this.region,
        '--capabilities', 'CAPABILITY_IAM',
        '--no-confirm-changeset',
        '--no-fail-on-empty-changeset',
        '--tags', 'CreatedBy=no-wing-Q-Agent Purpose=AWS-Lambda-Hackathon'
      ];

      console.log(`🚀 Running: sam ${deployArgs.join(' ')}`);

      const deployProcess = spawn('sam', deployArgs, {
        cwd: projectPath,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      deployProcess.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        console.log(output.trim());
      });

      deployProcess.stderr.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        // SAM sometimes outputs progress to stderr
        console.log(output.trim());
      });

      deployProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ SAM deployment completed successfully');
          resolve(stdout);
        } else {
          reject(new Error(`SAM deployment failed with code ${code}: ${stderr}`));
        }
      });

      deployProcess.on('error', (error) => {
        reject(new Error(`SAM deployment process error: ${error.message}`));
      });
    });
  }

  /**
   * Get CloudFormation stack outputs
   */
  private async getStackOutputs(stackName: string): Promise<Record<string, string>> {
    try {
      const command = `aws cloudformation describe-stacks --stack-name ${stackName} --region ${this.region} --query 'Stacks[0].Outputs' --output json`;
      
      const outputJson = execSync(command, { 
        encoding: 'utf8',
        stdio: 'pipe'
      });

      const outputs = JSON.parse(outputJson) || [];
      const result: Record<string, string> = {};

      outputs.forEach((output: any) => {
        result[output.OutputKey] = output.OutputValue;
      });

      console.log('📊 Stack outputs:', result);
      return result;

    } catch (error) {
      console.warn('⚠️ Could not retrieve stack outputs:', error);
      return {};
    }
  }

  /**
   * Delete SAM stack
   */
  async deleteSAMStack(stackName: string): Promise<boolean> {
    try {
      console.log(`🗑️ Deleting stack: ${stackName}`);
      
      const deleteCommand = `sam delete --stack-name ${stackName} --region ${this.region} --no-prompts`;
      
      execSync(deleteCommand, { 
        stdio: 'inherit',
        encoding: 'utf8'
      });

      console.log(`✅ Stack ${stackName} deleted successfully`);
      return true;

    } catch (error) {
      console.error(`❌ Failed to delete stack ${stackName}:`, error);
      return false;
    }
  }

  /**
   * Get function logs
   */
  async getFunctionLogs(functionName: string, stackName?: string): Promise<string[]> {
    try {
      const command = stackName 
        ? `sam logs --stack-name ${stackName} --region ${this.region}`
        : `aws logs filter-log-events --log-group-name /aws/lambda/${functionName} --region ${this.region} --query 'events[*].message' --output text`;

      const logs = execSync(command, {
        encoding: 'utf8',
        stdio: 'pipe'
      });

      return logs.split('\n').filter(line => line.trim());

    } catch (error) {
      console.warn('⚠️ Could not retrieve function logs:', error);
      return [];
    }
  }

  /**
   * Test function locally
   */
  async testFunctionLocally(projectPath: string, functionName: string, testEvent?: any): Promise<any> {
    try {
      console.log(`🧪 Testing function locally: ${functionName}`);

      const testEventFile = path.join(projectPath, 'test-event.json');
      
      if (testEvent) {
        fs.writeFileSync(testEventFile, JSON.stringify(testEvent, null, 2));
      }

      const invokeArgs = ['local', 'invoke', functionName];
      if (testEvent) {
        invokeArgs.push('--event', testEventFile);
      }

      const result = execSync(`sam ${invokeArgs.join(' ')}`, {
        cwd: projectPath,
        encoding: 'utf8',
        stdio: 'pipe'
      });

      // Clean up test event file
      if (testEvent && fs.existsSync(testEventFile)) {
        fs.unlinkSync(testEventFile);
      }

      console.log('✅ Local test completed');
      return JSON.parse(result);

    } catch (error) {
      console.error('❌ Local test failed:', error);
      throw error;
    }
  }

  /**
   * Start local API for testing
   */
  async startLocalAPI(projectPath: string): Promise<void> {
    console.log('🌐 Starting local API server...');
    console.log('📡 API will be available at: http://localhost:3000');
    console.log('🛑 Press Ctrl+C to stop');

    const apiProcess = spawn('sam', ['local', 'start-api'], {
      cwd: projectPath,
      stdio: 'inherit'
    });

    apiProcess.on('error', (error) => {
      console.error('❌ Failed to start local API:', error);
    });

    // Return immediately - the process runs in background
    return Promise.resolve();
  }
}
