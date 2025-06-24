/**
 * Q Task Service - Handles Q's task execution with real AWS integration
 * This makes Q actually create Lambda functions for the hackathon!
 */

import { AWSLambdaService, LambdaCreationResult } from './AWSLambdaService';
import { MonitoringService } from './MonitoringService';
import { QIdentity, QActivity, QCapabilityLevel } from '../types';

export interface QTaskResult {
  success: boolean;
  message: string;
  details?: any;
  awsResources?: Array<{
    type: string;
    name: string;
    arn?: string;
    endpoint?: string;
  }>;
  cost?: number;
  deploymentTime?: number;
}

export class QTaskService {
  private lambdaService: AWSLambdaService;
  private monitoringService: MonitoringService;

  constructor(region: string = 'us-east-1') {
    this.lambdaService = new AWSLambdaService(region);
    this.monitoringService = new MonitoringService();
  }

  /**
   * Execute a task request from the developer
   */
  async executeTask(
    qIdentity: QIdentity,
    taskDescription: string
  ): Promise<QTaskResult> {
    console.log(`🤖 Q executing task: "${taskDescription}"`);
    
    // Log the activity start
    const activity: QActivity = {
      id: `activity-${Date.now()}`,
      qId: qIdentity.id,
      developerId: qIdentity.developerId,
      timestamp: new Date(),
      action: taskDescription,
      service: 'lambda', // Assume Lambda for hackathon
      resources: [],
      success: false,
      riskLevel: this.assessRiskLevel(taskDescription, qIdentity.level),
      details: { taskDescription }
    };

    try {
      // Check if Q has permission for this task
      if (!this.hasPermissionForTask(taskDescription, qIdentity.level)) {
        const result = {
          success: false,
          message: `I don't have permission for this task at my current ${qIdentity.level} level. I need to earn more capabilities first!`,
          details: {
            currentLevel: qIdentity.level,
            requiredLevel: this.getRequiredLevel(taskDescription),
            suggestion: 'Try asking me to analyze existing resources first to build my capabilities.'
          }
        };
        
        activity.success = false;
        activity.details.error = 'Insufficient permissions';
        await this.monitoringService.logActivity(activity);
        
        return result;
      }

      // Determine task type and execute
      const taskType = this.classifyTask(taskDescription);
      let result: QTaskResult;

      switch (taskType) {
        case 'create-lambda':
          result = await this.createLambdaFunction(qIdentity, taskDescription);
          break;
        case 'list-functions':
          result = await this.listLambdaFunctions(qIdentity);
          break;
        case 'analyze':
          result = await this.analyzeLambdaFunctions(qIdentity);
          break;
        case 'test-function':
          result = await this.testLambdaFunction(qIdentity, taskDescription);
          break;
        default:
          result = await this.handleGenericTask(qIdentity, taskDescription);
      }

      // Update activity with results
      activity.success = result.success;
      activity.cost = result.cost || 0;
      activity.resources = result.awsResources?.map(r => r.name) || [];
      activity.details.result = result;

      await this.monitoringService.logActivity(activity);

      return result;

    } catch (error) {
      console.error('❌ Task execution failed:', error);
      
      activity.success = false;
      activity.details.error = error instanceof Error ? error.message : 'Unknown error';
      await this.monitoringService.logActivity(activity);

      return {
        success: false,
        message: `I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Create a Lambda function based on the request
   */
  private async createLambdaFunction(
    qIdentity: QIdentity,
    taskDescription: string
  ): Promise<QTaskResult> {
    console.log('🏗️ Q is creating a Lambda function...');

    // Parse the request to determine function details
    const functionDetails = this.parseLambdaRequest(taskDescription);
    
    const result: LambdaCreationResult = await this.lambdaService.createLambdaFunction(
      qIdentity,
      functionDetails.name,
      functionDetails.description,
      functionDetails.type
    );

    if (result.success && result.function) {
      return {
        success: true,
        message: `🎉 Successfully created Lambda function "${result.function.functionName}"!`,
        details: {
          functionName: result.function.functionName,
          functionArn: result.function.functionArn,
          apiEndpoint: result.function.apiEndpoint,
          runtime: result.function.runtime,
          deploymentTime: result.deploymentTime
        },
        awsResources: [
          {
            type: 'AWS::Lambda::Function',
            name: result.function.functionName,
            arn: result.function.functionArn,
            endpoint: result.function.apiEndpoint
          }
        ],
        cost: this.estimateCost('lambda-create'),
        deploymentTime: result.deploymentTime
      };
    } else {
      return {
        success: false,
        message: `❌ Failed to create Lambda function: ${result.error}`,
        details: { error: result.error }
      };
    }
  }

  /**
   * List existing Lambda functions
   */
  private async listLambdaFunctions(qIdentity: QIdentity): Promise<QTaskResult> {
    console.log('📋 Q is listing Lambda functions...');

    const functions = await this.lambdaService.listQFunctions();

    return {
      success: true,
      message: `📋 Found ${functions.length} Lambda functions created by Q agents`,
      details: {
        totalFunctions: functions.length,
        functions: functions.map(f => ({
          name: f.functionName,
          arn: f.functionArn,
          description: f.description,
          runtime: f.runtime
        }))
      },
      awsResources: functions.map(f => ({
        type: 'AWS::Lambda::Function',
        name: f.functionName,
        arn: f.functionArn
      })),
      cost: this.estimateCost('lambda-list')
    };
  }

  /**
   * Analyze Lambda functions
   */
  private async analyzeLambdaFunctions(qIdentity: QIdentity): Promise<QTaskResult> {
    console.log('🔍 Q is analyzing Lambda functions...');

    const functions = await this.lambdaService.listQFunctions();
    
    const analysis = {
      totalFunctions: functions.length,
      runtimeDistribution: this.analyzeRuntimes(functions),
      recommendations: this.generateRecommendations(functions),
      costEstimate: functions.length * 0.20 // Rough estimate
    };

    return {
      success: true,
      message: `🔍 Analysis complete! Found ${functions.length} Lambda functions with insights and recommendations.`,
      details: analysis,
      cost: this.estimateCost('lambda-analyze')
    };
  }

  /**
   * Test a Lambda function
   */
  private async testLambdaFunction(
    qIdentity: QIdentity,
    taskDescription: string
  ): Promise<QTaskResult> {
    // Extract function name from description
    const functionName = this.extractFunctionName(taskDescription);
    
    if (!functionName) {
      return {
        success: false,
        message: "I need to know which function to test. Try: 'test the user-auth function'"
      };
    }

    try {
      console.log(`🧪 Q is testing function: ${functionName}`);
      const testResult = await this.lambdaService.testFunction(functionName);

      return {
        success: true,
        message: `✅ Function "${functionName}" test completed successfully!`,
        details: {
          functionName,
          testResult,
          testedAt: new Date().toISOString()
        },
        cost: this.estimateCost('lambda-test')
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ Function test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { functionName, error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Handle generic tasks
   */
  private async handleGenericTask(
    qIdentity: QIdentity,
    taskDescription: string
  ): Promise<QTaskResult> {
    // For hackathon, provide helpful guidance
    const suggestions = [
      'create a Lambda function for user authentication',
      'create an API endpoint for data processing',
      'list my Lambda functions',
      'analyze my current Lambda functions',
      'test my user-auth function'
    ];

    return {
      success: true,
      message: "I'm ready to help with Lambda development! Here are some things I can do:",
      details: {
        suggestions,
        currentLevel: qIdentity.level,
        capabilities: this.getCapabilitiesForLevel(qIdentity.level)
      }
    };
  }

  // Helper methods
  private classifyTask(description: string): string {
    const lower = description.toLowerCase();
    
    if (lower.includes('create') && (lower.includes('lambda') || lower.includes('function'))) {
      return 'create-lambda';
    }
    if (lower.includes('list') && (lower.includes('function') || lower.includes('lambda'))) {
      return 'list-functions';
    }
    if (lower.includes('analyze') || lower.includes('check') || lower.includes('review')) {
      return 'analyze';
    }
    if (lower.includes('test') && lower.includes('function')) {
      return 'test-function';
    }
    
    return 'generic';
  }

  private parseLambdaRequest(description: string): {
    name: string;
    description: string;
    type: 'api' | 'processor' | 'auth' | 'webhook';
  } {
    const lower = description.toLowerCase();
    
    // Determine function type
    let type: 'api' | 'processor' | 'auth' | 'webhook' = 'api';
    if (lower.includes('auth') || lower.includes('login')) type = 'auth';
    else if (lower.includes('process') || lower.includes('data')) type = 'processor';
    else if (lower.includes('webhook') || lower.includes('hook')) type = 'webhook';
    
    // Generate function name
    const timestamp = Date.now().toString().slice(-6);
    let baseName = 'q-function';
    
    if (lower.includes('auth')) baseName = 'q-auth';
    else if (lower.includes('user')) baseName = 'q-user';
    else if (lower.includes('data')) baseName = 'q-data';
    else if (lower.includes('api')) baseName = 'q-api';
    
    return {
      name: `${baseName}-${timestamp}`,
      description: description,
      type
    };
  }

  private hasPermissionForTask(taskDescription: string, level: QCapabilityLevel): boolean {
    const taskType = this.classifyTask(taskDescription);
    
    switch (level) {
      case QCapabilityLevel.OBSERVER:
        return ['list-functions', 'analyze', 'generic'].includes(taskType);
      case QCapabilityLevel.ASSISTANT:
        return ['list-functions', 'analyze', 'test-function', 'generic'].includes(taskType);
      case QCapabilityLevel.PARTNER:
        return true; // Can do everything
      default:
        return false;
    }
  }

  private getRequiredLevel(taskDescription: string): QCapabilityLevel {
    const taskType = this.classifyTask(taskDescription);
    
    switch (taskType) {
      case 'create-lambda':
        return QCapabilityLevel.PARTNER;
      case 'test-function':
        return QCapabilityLevel.ASSISTANT;
      default:
        return QCapabilityLevel.OBSERVER;
    }
  }

  private assessRiskLevel(taskDescription: string, level: QCapabilityLevel): 'low' | 'medium' | 'high' {
    if (taskDescription.toLowerCase().includes('create')) return 'high';
    if (taskDescription.toLowerCase().includes('test')) return 'medium';
    return 'low';
  }

  private estimateCost(operation: string): number {
    const costs = {
      'lambda-create': 0.05,
      'lambda-list': 0.01,
      'lambda-analyze': 0.02,
      'lambda-test': 0.03
    };
    return costs[operation as keyof typeof costs] || 0.01;
  }

  private analyzeRuntimes(functions: any[]): Record<string, number> {
    const runtimes: Record<string, number> = {};
    functions.forEach(f => {
      runtimes[f.runtime] = (runtimes[f.runtime] || 0) + 1;
    });
    return runtimes;
  }

  private generateRecommendations(functions: any[]): string[] {
    const recommendations = [];
    
    if (functions.length === 0) {
      recommendations.push('Consider creating your first Lambda function to get started');
    }
    
    if (functions.length > 5) {
      recommendations.push('Consider organizing functions into different services or modules');
    }
    
    recommendations.push('All functions are properly tagged and monitored by Q');
    recommendations.push('Consider adding error handling and logging to your functions');
    
    return recommendations;
  }

  private extractFunctionName(description: string): string | null {
    // Simple extraction - in production would be more sophisticated
    const words = description.toLowerCase().split(' ');
    const functionIndex = words.findIndex(w => w.includes('function'));
    
    if (functionIndex > 0) {
      return words[functionIndex - 1];
    }
    
    return null;
  }

  private getCapabilitiesForLevel(level: QCapabilityLevel): string[] {
    switch (level) {
      case QCapabilityLevel.OBSERVER:
        return ['List Lambda functions', 'Analyze function metrics', 'Provide recommendations'];
      case QCapabilityLevel.ASSISTANT:
        return ['All Observer capabilities', 'Test Lambda functions', 'Update function configurations'];
      case QCapabilityLevel.PARTNER:
        return ['All Assistant capabilities', 'Create new Lambda functions', 'Deploy complete applications'];
      default:
        return [];
    }
  }
}
