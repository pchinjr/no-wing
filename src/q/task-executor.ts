/**
 * Q Task Execution System
 * 
 * Handles Q's task execution with proper capability level checking
 * and simulated AWS integration for the MVP demo
 */

import { QIdentityManager, QCapabilityLevel, QTask } from './identity';
import { QGitIdentityManager } from './git-identity';
import chalk from 'chalk';

export interface TaskResult {
  success: boolean;
  data?: any;
  error?: string;
  qAdvanced?: boolean;
}

export class QTaskExecutor {
  private identityManager: QIdentityManager;
  private gitManager: QGitIdentityManager | null = null;

  constructor(region: string = 'us-east-1') {
    this.identityManager = new QIdentityManager();
  }

  /**
   * Execute a task for Q with capability level checking
   */
  async executeTask(taskDescription: string): Promise<TaskResult> {
    console.log(chalk.blue(`🤖 Q is analyzing task: "${taskDescription}"`));

    // Load Q's identity
    const identity = await this.identityManager.loadIdentity();
    if (!identity) {
      return {
        success: false,
        error: 'Q identity not found. Run "no-wing init" first.'
      };
    }

    // Initialize Git manager
    this.gitManager = new QGitIdentityManager(identity);

    console.log(chalk.cyan(`📊 Q's current level: ${identity.level.toUpperCase()}`));
    console.log(chalk.cyan(`✅ Successful tasks: ${identity.successfulTasks}`));

    // Determine task type and required level
    const taskInfo = this.analyzeTask(taskDescription);
    const task: QTask = {
      id: this.generateTaskId(),
      type: taskInfo.type,
      description: taskDescription,
      requiredLevel: taskInfo.requiredLevel,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    // Check if Q can perform this task
    if (!this.identityManager.canPerformTask(task.type, task.requiredLevel)) {
      return {
        success: false,
        error: `Q's current level (${identity.level}) is insufficient for this task. Required: ${task.requiredLevel}`
      };
    }

    console.log(chalk.green(`✅ Q has permission to perform this ${task.requiredLevel} level task`));

    // Execute the task
    task.status = 'in_progress';
    try {
      const result = await this.performTask(task);
      task.status = 'completed';
      task.completedAt = new Date().toISOString();
      task.result = result;

      // Record success and check for advancement
      const advanced = await this.identityManager.recordTaskSuccess(task);

      console.log(chalk.green(`🎉 Task completed successfully!`));
      if (advanced) {
        const updatedIdentity = this.identityManager.getIdentity();
        console.log(chalk.magenta(`🚀 Q has advanced to ${updatedIdentity?.level.toUpperCase()} level!`));
      }

      return {
        success: true,
        data: result,
        qAdvanced: advanced
      };

    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      
      await this.identityManager.recordTaskFailure(task);
      
      console.log(chalk.red(`❌ Task failed: ${task.error}`));
      
      return {
        success: false,
        error: task.error
      };
    }
  }

  /**
   * Analyze task description to determine type and required level
   */
  private analyzeTask(description: string): { type: string; requiredLevel: QCapabilityLevel } {
    const lowerDesc = description.toLowerCase();

    // Observer level tasks
    if (lowerDesc.includes('analyze') || lowerDesc.includes('read') || lowerDesc.includes('logs') || lowerDesc.includes('info')) {
      return { type: 'analysis', requiredLevel: QCapabilityLevel.OBSERVER };
    }

    // Assistant level tasks  
    if (lowerDesc.includes('update') || lowerDesc.includes('modify') || lowerDesc.includes('configure') || lowerDesc.includes('deploy')) {
      return { type: 'modification', requiredLevel: QCapabilityLevel.ASSISTANT };
    }

    // Partner level tasks
    if (lowerDesc.includes('create') || lowerDesc.includes('build') || lowerDesc.includes('design') || lowerDesc.includes('new')) {
      return { type: 'creation', requiredLevel: QCapabilityLevel.PARTNER };
    }

    // Default to observer level
    return { type: 'analysis', requiredLevel: QCapabilityLevel.OBSERVER };
  }

  /**
   * Perform the actual task based on type
   */
  private async performTask(task: QTask): Promise<any> {
    switch (task.type) {
      case 'analysis':
        return await this.performAnalysisTask(task);
      
      case 'modification':
        return await this.performModificationTask(task);
      
      case 'creation':
        return await this.performCreationTask(task);
      
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }

  /**
   * Observer Level: Analysis tasks
   */
  private async performAnalysisTask(task: QTask): Promise<any> {
    console.log(chalk.blue('🔍 Performing analysis task...'));

    if (task.description.toLowerCase().includes('logs')) {
      // Simulate log analysis
      return {
        action: 'log_analysis',
        summary: 'Analyzed recent Lambda function logs',
        findings: [
          'Function is executing successfully',
          'Average response time: 45ms',
          'No errors detected in last 24 hours',
          'Memory usage is optimal'
        ],
        recommendations: [
          'Function performance is good',
          'Consider adding more detailed logging for debugging'
        ]
      };
    } else {
      // Simulate function info analysis
      return {
        action: 'function_analysis',
        summary: 'Analyzed Lambda function configuration',
        findings: [
          'Function version: 1.0.0',
          'Memory allocation: 128MB',
          'Timeout: 30 seconds',
          'Runtime: Node.js 18.x'
        ],
        recommendations: [
          'Configuration appears optimal for current workload',
          'Monitor memory usage for potential optimization'
        ]
      };
    }
  }

  /**
   * Assistant Level: Modification tasks
   */
  private async performModificationTask(task: QTask): Promise<any> {
    console.log(chalk.yellow('🔧 Performing modification task...'));

    // Simulate configuration update
    return {
      action: 'configuration_update',
      summary: 'Updated Lambda function configuration',
      changes: [
        'Increased memory from 128MB to 256MB',
        'Updated timeout from 30s to 60s',
        'Added environment variable: NODE_ENV=production'
      ],
      status: 'Configuration updated successfully',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Partner Level: Creation tasks
   */
  private async performCreationTask(task: QTask): Promise<any> {
    console.log(chalk.green('🏗️ Performing creation task...'));

    // Simulate new resource creation
    const result: any = {
      action: 'resource_creation',
      summary: 'Created new Lambda function',
      created: [
        'Lambda function: user-authentication-handler',
        'IAM role: user-auth-lambda-role',
        'CloudWatch log group: /aws/lambda/user-authentication-handler'
      ],
      configuration: {
        runtime: 'nodejs18.x',
        memory: 256,
        timeout: 30,
        environment: {
          NODE_ENV: 'production',
          LOG_LEVEL: 'info'
        }
      },
      status: 'Resources created successfully',
      timestamp: new Date().toISOString()
    };

    // For creation tasks, Q should make a commit to document the work
    if (this.gitManager && task.description.toLowerCase().includes('create')) {
      try {
        console.log(chalk.blue('📝 Q is documenting this creation in Git...'));
        
        // Create a simple file to represent Q's work
        const fs = await import('fs/promises');
        const workLog = {
          task: task.description,
          result: result,
          qLevel: 'partner',
          timestamp: new Date().toISOString()
        };
        
        await fs.writeFile('.no-wing/q-work-log.json', JSON.stringify(workLog, null, 2));
        
        // Commit as Q
        const commitHash = await this.gitManager.commitAsQ(
          `feat: ${task.description}\n\nQ created new resources as Partner-level agent`,
          ['.no-wing/q-work-log.json']
        );
        
        result.gitCommit = commitHash;
        console.log(chalk.green(`✅ Q documented work in commit: ${commitHash.substring(0, 8)}`));
        
      } catch (error) {
        console.log(chalk.yellow('⚠️ Q could not make Git commit, but task completed'));
      }
    }

    return result;
  }

  /**
   * Generate unique task ID
   */
  private generateTaskId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  }

  /**
   * Get Q's current status
   */
  async getQStatus(): Promise<any> {
    const identity = await this.identityManager.loadIdentity();
    if (!identity) {
      return { error: 'Q identity not found' };
    }

    return {
      id: identity.id,
      name: identity.name,
      level: identity.level,
      successfulTasks: identity.successfulTasks,
      failedTasks: identity.failedTasks,
      permissions: identity.permissions.length,
      lastActive: identity.lastActive,
      nextLevelRequirement: this.getNextLevelRequirement(identity.level, identity.successfulTasks)
    };
  }

  /**
   * Get requirement for next level advancement
   */
  private getNextLevelRequirement(currentLevel: QCapabilityLevel, successfulTasks: number): string {
    switch (currentLevel) {
      case QCapabilityLevel.OBSERVER:
        const needed = 3 - successfulTasks;
        return needed > 0 ? `${needed} more successful tasks to reach Assistant level` : 'Ready for Assistant level';
      
      case QCapabilityLevel.ASSISTANT:
        const neededForPartner = 8 - successfulTasks;
        return neededForPartner > 0 ? `${neededForPartner} more successful tasks to reach Partner level` : 'Ready for Partner level';
      
      case QCapabilityLevel.PARTNER:
        return 'Maximum level reached';
      
      default:
        return 'Unknown level';
    }
  }
}
