import { readFileSync } from 'fs';
import { join } from 'path';

export interface QPermissionRequest {
  action: string;
  resource: string;
  reason: string;
  riskLevel: 'low' | 'medium' | 'high';
  requiredApproval: boolean;
  timestamp: string;
  requestId: string;
}

export interface QOperationLog {
  requestId: string;
  action: string;
  resource: string;
  status: 'pending' | 'approved' | 'denied' | 'completed' | 'failed';
  humanApprover?: string;
  timestamp: string;
  duration?: number;
  errorMessage?: string;
  rollbackRequired?: boolean;
}

export class QVerificationSystem {
  private capabilitiesPath: string;
  private operationLogs: QOperationLog[] = [];
  private pendingRequests: QPermissionRequest[] = [];

  constructor() {
    this.capabilitiesPath = join(__dirname, 'capabilities.json');
  }

  /**
   * Get Q's current permissions based on capability level
   */
  getCurrentPermissions(capabilityLevel: number): string[] {
    const capabilities = JSON.parse(readFileSync(this.capabilitiesPath, 'utf8'));
    const permissions: string[] = [];

    // Accumulate permissions from level 1 up to current level
    for (let level = 1; level <= capabilityLevel; level++) {
      if (capabilities.levels[level]) {
        permissions.push(...capabilities.levels[level].permissions);
      }
    }

    return [...new Set(permissions)]; // Remove duplicates
  }

  /**
   * Check if Q can perform a specific action
   */
  canPerformAction(action: string, capabilityLevel: number): boolean {
    const allowedPermissions = this.getCurrentPermissions(capabilityLevel);
    return allowedPermissions.includes(action);
  }

  /**
   * Request permission for Q to perform an action
   */
  requestPermission(
    action: string,
    resource: string,
    reason: string,
    capabilityLevel: number
  ): QPermissionRequest {
    const requestId = this.generateRequestId();
    const riskLevel = this.assessRiskLevel(action, resource);
    const requiredApproval = !this.canPerformAction(action, capabilityLevel) || riskLevel === 'high';

    const request: QPermissionRequest = {
      action,
      resource,
      reason,
      riskLevel,
      requiredApproval,
      timestamp: new Date().toISOString(),
      requestId
    };

    if (requiredApproval) {
      this.pendingRequests.push(request);
      this.displayApprovalRequest(request);
    }

    return request;
  }

  /**
   * Human approves or denies Q's permission request
   */
  approveRequest(requestId: string, approved: boolean, approver: string): boolean {
    const requestIndex = this.pendingRequests.findIndex(r => r.requestId === requestId);
    
    if (requestIndex === -1) {
      console.log(`❌ Request ${requestId} not found`);
      return false;
    }

    const request = this.pendingRequests[requestIndex];
    this.pendingRequests.splice(requestIndex, 1);

    const log: QOperationLog = {
      requestId,
      action: request.action,
      resource: request.resource,
      status: approved ? 'approved' : 'denied',
      humanApprover: approver,
      timestamp: new Date().toISOString()
    };

    this.operationLogs.push(log);

    if (approved) {
      console.log(`✅ ${approver} approved Q's request to ${request.action} on ${request.resource}`);
    } else {
      console.log(`❌ ${approver} denied Q's request to ${request.action} on ${request.resource}`);
    }

    return approved;
  }

  /**
   * Log Q's operation completion
   */
  logOperation(
    requestId: string,
    status: 'completed' | 'failed',
    duration?: number,
    errorMessage?: string
  ): void {
    const logIndex = this.operationLogs.findIndex(l => l.requestId === requestId);
    
    if (logIndex !== -1) {
      this.operationLogs[logIndex].status = status;
      this.operationLogs[logIndex].duration = duration;
      this.operationLogs[logIndex].errorMessage = errorMessage;
      
      if (status === 'failed' && this.shouldRollback(requestId)) {
        this.operationLogs[logIndex].rollbackRequired = true;
        this.triggerRollback(requestId);
      }
    }
  }

  /**
   * Get Q's operation history for audit
   */
  getOperationHistory(limit?: number): QOperationLog[] {
    const logs = this.operationLogs.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    return limit ? logs.slice(0, limit) : logs;
  }

  /**
   * Get Q's current success metrics
   */
  getSuccessMetrics(): {
    totalOperations: number;
    successRate: number;
    errorRate: number;
    averageDuration: number;
    securityViolations: number;
  } {
    const completedOps = this.operationLogs.filter(l => 
      l.status === 'completed' || l.status === 'failed'
    );
    
    const successful = completedOps.filter(l => l.status === 'completed');
    const failed = completedOps.filter(l => l.status === 'failed');
    const violations = this.operationLogs.filter(l => l.rollbackRequired);
    
    const durations = completedOps
      .filter(l => l.duration)
      .map(l => l.duration!);
    
    return {
      totalOperations: completedOps.length,
      successRate: completedOps.length > 0 ? (successful.length / completedOps.length) * 100 : 0,
      errorRate: completedOps.length > 0 ? (failed.length / completedOps.length) * 100 : 0,
      averageDuration: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
      securityViolations: violations.length
    };
  }

  /**
   * Display pending approval requests to human
   */
  displayPendingRequests(): void {
    if (this.pendingRequests.length === 0) {
      console.log('✅ No pending Q approval requests');
      return;
    }

    console.log('\n🤖 Q Permission Requests Pending Approval:\n');
    
    this.pendingRequests.forEach((request, index) => {
      console.log(`${index + 1}. Request ID: ${request.requestId}`);
      console.log(`   Action: ${request.action}`);
      console.log(`   Resource: ${request.resource}`);
      console.log(`   Reason: ${request.reason}`);
      console.log(`   Risk Level: ${this.getRiskEmoji(request.riskLevel)} ${request.riskLevel.toUpperCase()}`);
      console.log(`   Time: ${new Date(request.timestamp).toLocaleString()}`);
      console.log('');
    });

    console.log('💡 To approve: no-wing approve <requestId>');
    console.log('💡 To deny: no-wing deny <requestId>');
  }

  private displayApprovalRequest(request: QPermissionRequest): void {
    console.log('\n🤖 Q Permission Request:');
    console.log(`   ID: ${request.requestId}`);
    console.log(`   Action: ${request.action}`);
    console.log(`   Resource: ${request.resource}`);
    console.log(`   Reason: ${request.reason}`);
    console.log(`   Risk: ${this.getRiskEmoji(request.riskLevel)} ${request.riskLevel.toUpperCase()}`);
    console.log('\n💡 This requires your approval. Use:');
    console.log(`   no-wing approve ${request.requestId}  # to approve`);
    console.log(`   no-wing deny ${request.requestId}     # to deny`);
  }

  private assessRiskLevel(action: string, resource: string): 'low' | 'medium' | 'high' {
    // High risk actions
    const highRiskActions = [
      'iam:CreateRole',
      'iam:AttachRolePolicy',
      'iam:DeleteRole',
      's3:DeleteBucket',
      'lambda:DeleteFunction',
      'dynamodb:DeleteTable'
    ];

    // Medium risk actions
    const mediumRiskActions = [
      'lambda:UpdateFunctionCode',
      's3:PutObject',
      'dynamodb:PutItem',
      'cloudformation:UpdateStack'
    ];

    if (highRiskActions.some(action.includes.bind(action))) {
      return 'high';
    }
    
    if (mediumRiskActions.some(action.includes.bind(action))) {
      return 'medium';
    }

    // Production resources are always high risk
    if (resource.includes('prod') || resource.includes('production')) {
      return 'high';
    }

    return 'low';
  }

  private shouldRollback(requestId: string): boolean {
    const log = this.operationLogs.find(l => l.requestId === requestId);
    return log?.status === 'failed' && log.action.includes('Create');
  }

  private triggerRollback(requestId: string): void {
    console.log(`🔄 Triggering rollback for failed operation ${requestId}`);
    // Implementation would depend on the specific action that failed
  }

  private generateRequestId(): string {
    return `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getRiskEmoji(riskLevel: string): string {
    switch (riskLevel) {
      case 'low': return '🟢';
      case 'medium': return '🟡';
      case 'high': return '🔴';
      default: return '⚪';
    }
  }
}
