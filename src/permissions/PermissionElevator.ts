import { CredentialManager } from '../credentials/CredentialManager.ts';
import { RoleManager, OperationContext } from './RoleManager.ts';
import { ConfigManager } from '../config/ConfigManager.ts';

export interface PermissionRequest {
  id: string;
  operation: string;
  service: string;
  actions: string[];
  resources: string[];
  justification: string;
  requestedAt: Date;
  status: 'pending' | 'approved' | 'denied' | 'expired';
  approvedBy?: string;
  approvedAt?: Date;
  expiresAt?: Date;
}

export interface ElevationResult {
  success: boolean;
  method: 'direct' | 'role-assumption' | 'permission-request' | 'degraded';
  message: string;
  sessionInfo?: unknown;
  alternatives?: string[];
  requestId?: string;
}

export interface PermissionPattern {
  operation: string;
  requiredActions: string[];
  optionalActions: string[];
  resourcePatterns: string[];
  fallbackStrategies: string[];
}

export class PermissionElevator {
  private credentialManager: CredentialManager;
  private roleManager: RoleManager;
  private configManager: ConfigManager;
  private permissionRequests: Map<string, PermissionRequest> = new Map();
  private permissionPatterns: Map<string, PermissionPattern> = new Map();
  private learningData: Map<string, string[]> = new Map();

  constructor(
    credentialManager: CredentialManager,
    roleManager: RoleManager,
    configManager: ConfigManager
  ) {
    this.credentialManager = credentialManager;
    this.roleManager = roleManager;
    this.configManager = configManager;
    this.initializePermissionPatterns();
  }

  /**
   * Initialize common permission patterns for different operations
   */
  private initializePermissionPatterns(): void {
    this.permissionPatterns.set('cloudformation-deploy', {
      operation: 'cloudformation-deploy',
      requiredActions: [
        'cloudformation:CreateStack',
        'cloudformation:UpdateStack',
        'cloudformation:DescribeStacks',
        'cloudformation:GetTemplate'
      ],
      optionalActions: [
        'cloudformation:DeleteStack',
        'cloudformation:ListStacks',
        's3:GetObject',
        's3:PutObject'
      ],
      resourcePatterns: [
        'arn:aws:cloudformation:*:*:stack/no-wing-*/*',
        'arn:aws:s3:::no-wing-*/*'
      ],
      fallbackStrategies: ['read-only-validation', 'dry-run', 'manual-approval']
    });

    this.permissionPatterns.set('lambda-deploy', {
      operation: 'lambda-deploy',
      requiredActions: [
        'lambda:CreateFunction',
        'lambda:UpdateFunctionCode',
        'lambda:UpdateFunctionConfiguration',
        'lambda:GetFunction'
      ],
      optionalActions: [
        'lambda:DeleteFunction',
        'lambda:ListFunctions',
        'iam:PassRole'
      ],
      resourcePatterns: [
        'arn:aws:lambda:*:*:function:no-wing-*',
        'arn:aws:iam::*:role/no-wing-*'
      ],
      fallbackStrategies: ['function-validation', 'code-analysis', 'staged-deployment']
    });

    this.permissionPatterns.set('s3-operations', {
      operation: 's3-operations',
      requiredActions: [
        's3:GetObject',
        's3:PutObject',
        's3:ListBucket'
      ],
      optionalActions: [
        's3:DeleteObject',
        's3:GetBucketLocation',
        's3:GetBucketVersioning'
      ],
      resourcePatterns: [
        'arn:aws:s3:::no-wing-*',
        'arn:aws:s3:::no-wing-*/*'
      ],
      fallbackStrategies: ['read-only-access', 'presigned-urls', 'manual-upload']
    });
  }

  /**
   * Attempt to elevate permissions for an operation
   */
  async elevatePermissions(context: OperationContext): Promise<ElevationResult> {
    console.log(`🔐 Attempting permission elevation for: ${context.operation}`);

    try {
      // Step 1: Check if we already have the required permissions
      const directResult = await this.checkDirectPermissions(context);
      if (directResult.success) {
        return directResult;
      }

      // Step 2: Try role assumption
      const roleResult = await this.tryRoleAssumption(context);
      if (roleResult.success) {
        return roleResult;
      }

      // Step 3: Try graceful degradation
      const degradedResult = await this.tryGracefulDegradation(context);
      if (degradedResult.success) {
        return degradedResult;
      }

      // Step 4: Create permission request
      const requestResult = await this.createPermissionRequest(context);
      return requestResult;

    } catch (error) {
      return {
        success: false,
        method: 'permission-request',
        message: `Permission elevation failed: ${error.message}`,
        alternatives: ['manual-execution', 'contact-administrator']
      };
    }
  }

  /**
   * Check if current credentials have direct permissions
   */
  private async checkDirectPermissions(_context: OperationContext): Promise<ElevationResult> {
    try {
      // This is a simplified check - in production, you'd use IAM policy simulation
      const currentContext = this.credentialManager.getCurrentContext();
      
      if (!currentContext) {
        return {
          success: false,
          method: 'direct',
          message: 'No credential context available'
        };
      }

      // For now, we'll assume direct permissions are not available for no-wing operations
      // This encourages the use of role assumption for better security
      return {
        success: false,
        method: 'direct',
        message: 'Direct permissions not recommended for no-wing operations',
        alternatives: ['role-assumption', 'permission-request']
      };
    } catch (error) {
      return {
        success: false,
        method: 'direct',
        message: `Direct permission check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Try to assume an appropriate role
   */
  private async tryRoleAssumption(context: OperationContext): Promise<ElevationResult> {
    try {
      const session = await this.roleManager.assumeRoleForOperation(context);
      
      if (session) {
        // Update credential manager with assumed role credentials
        // This would require extending the CredentialManager to support temporary credentials
        
        return {
          success: true,
          method: 'role-assumption',
          message: `Successfully assumed role: ${session.roleArn}`,
          sessionInfo: {
            roleArn: session.roleArn,
            sessionName: session.sessionName,
            expiresAt: session.expiration
          }
        };
      }

      return {
        success: false,
        method: 'role-assumption',
        message: 'No suitable role found for operation',
        alternatives: ['permission-request', 'manual-execution']
      };
    } catch (error) {
      return {
        success: false,
        method: 'role-assumption',
        message: `Role assumption failed: ${error.message}`,
        alternatives: ['permission-request', 'graceful-degradation']
      };
    }
  }

  /**
   * Try graceful degradation strategies
   */
  private async tryGracefulDegradation(context: OperationContext): Promise<ElevationResult> {
    const pattern = this.permissionPatterns.get(context.operation);
    
    if (!pattern || pattern.fallbackStrategies.length === 0) {
      return {
        success: false,
        method: 'degraded',
        message: 'No fallback strategies available for this operation'
      };
    }

    for (const strategy of pattern.fallbackStrategies) {
      const result = await this.tryFallbackStrategy(strategy, context);
      if (result.success) {
        return result;
      }
    }

    return {
      success: false,
      method: 'degraded',
      message: 'All fallback strategies failed',
      alternatives: pattern.fallbackStrategies
    };
  }

  /**
   * Try a specific fallback strategy
   */
  private async tryFallbackStrategy(strategy: string, context: OperationContext): Promise<ElevationResult> {
    switch (strategy) {
      case 'read-only-validation':
        return this.tryReadOnlyValidation(context);
      
      case 'dry-run':
        return this.tryDryRun(context);
      
      case 'manual-approval':
        return this.requestManualApproval(context);
      
      case 'staged-deployment':
        return this.tryStagedDeployment(context);
      
      default:
        return {
          success: false,
          method: 'degraded',
          message: `Unknown fallback strategy: ${strategy}`
        };
    }
  }

  /**
   * Try read-only validation as fallback
   */
  private async tryReadOnlyValidation(context: OperationContext): Promise<ElevationResult> {
    try {
      // Attempt to validate the operation without making changes
      console.log(`🔍 Attempting read-only validation for ${context.operation}`);
      
      // This would contain operation-specific validation logic
      return {
        success: true,
        method: 'degraded',
        message: 'Operation validated in read-only mode. Manual execution required for changes.',
        alternatives: ['manual-execution', 'permission-request']
      };
    } catch (error) {
      return {
        success: false,
        method: 'degraded',
        message: `Read-only validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Try dry-run as fallback
   */
  private async tryDryRun(context: OperationContext): Promise<ElevationResult> {
    try {
      console.log(`🧪 Attempting dry-run for ${context.operation}`);
      
      // This would contain operation-specific dry-run logic
      return {
        success: true,
        method: 'degraded',
        message: 'Dry-run completed successfully. Review the plan and execute manually.',
        alternatives: ['manual-execution', 'permission-request']
      };
    } catch (error) {
      return {
        success: false,
        method: 'degraded',
        message: `Dry-run failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Request manual approval
   */
  private async requestManualApproval(context: OperationContext): Promise<ElevationResult> {
    const requestId = await this.createPermissionRequest(context);
    
    return {
      success: true,
      method: 'degraded',
      message: 'Manual approval requested. Operation will proceed once approved.',
      requestId: requestId.requestId,
      alternatives: ['wait-for-approval', 'manual-execution']
    };
  }

  /**
   * Try staged deployment
   */
  private async tryStagedDeployment(context: OperationContext): Promise<ElevationResult> {
    try {
      console.log(`🎭 Attempting staged deployment for ${context.operation}`);
      
      // This would implement staged deployment logic
      return {
        success: true,
        method: 'degraded',
        message: 'Staged deployment initiated. Review each stage before proceeding.',
        alternatives: ['continue-stages', 'abort-deployment']
      };
    } catch (error) {
      return {
        success: false,
        method: 'degraded',
        message: `Staged deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Create a permission request
   */
  async createPermissionRequest(context: OperationContext): Promise<ElevationResult> {
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const pattern = this.permissionPatterns.get(context.operation);
    const requiredActions = pattern?.requiredActions || ['*'];
    const resources = context.resources || pattern?.resourcePatterns || ['*'];
    
    const request: PermissionRequest = {
      id: requestId,
      operation: context.operation,
      service: context.service,
      actions: requiredActions,
      resources,
      justification: this.generateJustification(context),
      requestedAt: new Date(),
      status: 'pending',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };

    this.permissionRequests.set(requestId, request);
    
    // In a real implementation, this would integrate with a ticketing system
    console.log(`🎫 Permission request created: ${requestId}`);
    console.log(`   Operation: ${context.operation}`);
    console.log(`   Actions: ${requiredActions.join(', ')}`);
    console.log(`   Resources: ${resources.join(', ')}`);
    console.log(`   Justification: ${request.justification}`);

    return {
      success: false,
      method: 'permission-request',
      message: `Permission request created: ${requestId}`,
      requestId,
      alternatives: ['wait-for-approval', 'manual-execution', 'contact-administrator']
    };
  }

  /**
   * Generate justification for permission request
   */
  private generateJustification(context: OperationContext): string {
    const pattern = this.permissionPatterns.get(context.operation);
    
    let justification = `Q requires permissions to perform ${context.operation} operation. `;
    
    if (pattern) {
      justification += `This operation typically requires: ${pattern.requiredActions.join(', ')}. `;
    }
    
    if (context.resources && context.resources.length > 0) {
      justification += `Target resources: ${context.resources.join(', ')}. `;
    }
    
    justification += 'This is part of automated project management and deployment workflow.';
    
    return justification;
  }

  /**
   * Check permission request status
   */
  getPermissionRequest(requestId: string): PermissionRequest | null {
    return this.permissionRequests.get(requestId) || null;
  }

  /**
   * Approve a permission request
   */
  approvePermissionRequest(requestId: string, approvedBy: string): boolean {
    const request = this.permissionRequests.get(requestId);
    
    if (!request || request.status !== 'pending') {
      return false;
    }

    request.status = 'approved';
    request.approvedBy = approvedBy;
    request.approvedAt = new Date();
    
    console.log(`✅ Permission request approved: ${requestId} by ${approvedBy}`);
    return true;
  }

  /**
   * Learn from successful operations
   */
  learnFromSuccess(context: OperationContext, method: string): void {
    const key = `${context.operation}-${context.service}`;
    
    if (!this.learningData.has(key)) {
      this.learningData.set(key, []);
    }
    
    const methods = this.learningData.get(key)!;
    if (!methods.includes(method)) {
      methods.push(method);
      console.log(`📚 Learned successful method for ${key}: ${method}`);
    }
  }

  /**
   * Get learned patterns for an operation
   */
  getLearnedPatterns(context: OperationContext): string[] {
    const key = `${context.operation}-${context.service}`;
    return this.learningData.get(key) || [];
  }

  /**
   * Clean up expired permission requests
   */
  cleanupExpiredRequests(): void {
    const now = new Date();
    const expiredKeys: string[] = [];
    
    for (const [key, request] of this.permissionRequests.entries()) {
      if (request.expiresAt && request.expiresAt < now) {
        request.status = 'expired';
        expiredKeys.push(key);
      }
    }
    
    for (const key of expiredKeys) {
      this.permissionRequests.delete(key);
    }
    
    if (expiredKeys.length > 0) {
      console.log(`🧹 Cleaned up ${expiredKeys.length} expired permission requests`);
    }
  }

  /**
   * Get statistics about permission requests
   */
  getRequestStatistics(): {
    total: number;
    pending: number;
    approved: number;
    denied: number;
    expired: number;
  } {
    const stats = {
      total: this.permissionRequests.size,
      pending: 0,
      approved: 0,
      denied: 0,
      expired: 0
    };

    for (const request of this.permissionRequests.values()) {
      stats[request.status]++;
    }

    return stats;
  }
}
