import * as fs from 'fs';
import * as path from 'path';
import { CloudWatchLogsClient, PutLogEventsCommand, CreateLogStreamCommand as _CreateLogStreamCommand } from '@aws-sdk/client-cloudwatch-logs';
import { CloudTrailClient, LookupEventsCommand } from '@aws-sdk/client-cloudtrail';
import { CredentialManager } from '../credentials/CredentialManager';

export interface AuditEvent {
  id: string;
  timestamp: Date;
  eventType: 'credential-switch' | 'role-assumption' | 'permission-request' | 'aws-operation' | 'error';
  actor: {
    type: 'user' | 'no-wing';
    identity: string;
    sessionId?: string;
  };
  operation: {
    service: string;
    action: string;
    resources?: string[];
    parameters?: Record<string, unknown>;
  };
  result: {
    success: boolean;
    errorMessage?: string;
    responseData?: unknown;
  };
  context: {
    sourceIp?: string;
    userAgent?: string;
    requestId?: string;
    correlationId?: string;
  };
  compliance: {
    dataClassification?: string;
    retentionPeriod?: number;
    encryptionRequired?: boolean;
  };
}

export interface AuditQuery {
  startTime?: Date;
  endTime?: Date;
  eventTypes?: string[];
  actorTypes?: string[];
  services?: string[];
  success?: boolean;
  limit?: number;
}

export interface ComplianceReport {
  reportId: string;
  generatedAt: Date;
  period: {
    startTime: Date;
    endTime: Date;
  };
  summary: {
    totalEvents: number;
    userActions: number;
    noWingActions: number;
    errors: number;
    permissionRequests: number;
  };
  events: AuditEvent[];
  violations: ComplianceViolation[];
}

export interface ComplianceViolation {
  id: string;
  type: 'unauthorized-access' | 'permission-escalation' | 'data-access' | 'policy-violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  event: AuditEvent;
  recommendation: string;
}

export class AuditLogger {
  private credentialManager: CredentialManager;
  private logFilePath: string;
  private cloudWatchEnabled: boolean;
  private cloudWatchLogGroup?: string;
  private cloudWatchLogStream?: string;
  private eventBuffer: AuditEvent[] = [];
  private bufferSize: number = 100;
  private correlationId: string;

  constructor(
    credentialManager: CredentialManager,
    options: {
      logFilePath?: string;
      cloudWatchLogGroup?: string;
      cloudWatchLogStream?: string;
      bufferSize?: number;
    } = {}
  ) {
    this.credentialManager = credentialManager;
    this.logFilePath = options.logFilePath || './.no-wing/audit.log';
    this.cloudWatchEnabled = !!options.cloudWatchLogGroup;
    this.cloudWatchLogGroup = options.cloudWatchLogGroup;
    this.cloudWatchLogStream = options.cloudWatchLogStream || `no-wing-${Date.now()}`;
    this.bufferSize = options.bufferSize || 100;
    this.correlationId = this.generateCorrelationId();
    
    this.ensureLogDirectory();
  }

  /**
   * Log an audit event
   */
  async logEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<void> {
    const auditEvent: AuditEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      ...event,
      context: {
        ...event.context,
        correlationId: this.correlationId
      }
    };

    // Add to buffer
    this.eventBuffer.push(auditEvent);

    // Write to local log immediately for critical events
    if (event.eventType === 'error' || event.result.success === false) {
      await this.writeToLocalLog(auditEvent);
    }

    // Flush buffer if it's full
    if (this.eventBuffer.length >= this.bufferSize) {
      await this.flushBuffer();
    }

    console.log(`📝 Audit event logged: ${auditEvent.eventType} - ${auditEvent.operation.action}`);
  }

  /**
   * Log credential context switch
   */
  async logCredentialSwitch(fromContext: string, toContext: string, success: boolean, error?: string): Promise<void> {
    const currentContext = this.credentialManager.getCurrentContext();
    
    await this.logEvent({
      eventType: 'credential-switch',
      actor: {
        type: currentContext?.type || 'unknown',
        identity: currentContext?.identity?.arn || 'unknown'
      },
      operation: {
        service: 'sts',
        action: 'switch-context',
        parameters: {
          fromContext,
          toContext
        }
      },
      result: {
        success,
        errorMessage: error
      },
      context: {},
      compliance: {
        dataClassification: 'internal',
        retentionPeriod: 2555, // 7 years in days
        encryptionRequired: true
      }
    });
  }

  /**
   * Log role assumption
   */
  async logRoleAssumption(roleArn: string, sessionName: string, success: boolean, error?: string): Promise<void> {
    const currentContext = this.credentialManager.getCurrentContext();
    
    await this.logEvent({
      eventType: 'role-assumption',
      actor: {
        type: currentContext?.type || 'no-wing',
        identity: currentContext?.identity?.arn || 'unknown',
        sessionId: sessionName
      },
      operation: {
        service: 'sts',
        action: 'assume-role',
        resources: [roleArn],
        parameters: {
          roleArn,
          sessionName
        }
      },
      result: {
        success,
        errorMessage: error
      },
      context: {},
      compliance: {
        dataClassification: 'confidential',
        retentionPeriod: 2555,
        encryptionRequired: true
      }
    });
  }

  /**
   * Log AWS operation
   */
  async logAWSOperation(
    service: string,
    action: string,
    resources: string[],
    parameters: Record<string, unknown>,
    success: boolean,
    error?: string,
    responseData?: unknown
  ): Promise<void> {
    const currentContext = this.credentialManager.getCurrentContext();
    
    await this.logEvent({
      eventType: 'aws-operation',
      actor: {
        type: currentContext?.type || 'unknown',
        identity: currentContext?.identity?.arn || 'unknown'
      },
      operation: {
        service,
        action,
        resources,
        parameters: this.sanitizeParameters(parameters)
      },
      result: {
        success,
        errorMessage: error,
        responseData: this.sanitizeResponseData(responseData)
      },
      context: {},
      compliance: {
        dataClassification: this.classifyDataByService(service),
        retentionPeriod: this.getRetentionPeriodByService(service),
        encryptionRequired: true
      }
    });
  }

  /**
   * Log permission request
   */
  async logPermissionRequest(
    operation: string,
    actions: string[],
    resources: string[],
    justification: string,
    requestId: string,
    status: string
  ): Promise<void> {
    const currentContext = this.credentialManager.getCurrentContext();
    
    await this.logEvent({
      eventType: 'permission-request',
      actor: {
        type: 'no-wing',
        identity: currentContext?.identity?.arn || 'unknown'
      },
      operation: {
        service: 'iam',
        action: 'request-permissions',
        resources,
        parameters: {
          operation,
          actions,
          justification,
          requestId,
          status
        }
      },
      result: {
        success: true
      },
      context: {},
      compliance: {
        dataClassification: 'confidential',
        retentionPeriod: 2555,
        encryptionRequired: true
      }
    });
  }

  /**
   * Query audit events
   */
  async queryEvents(query: AuditQuery): Promise<AuditEvent[]> {
    // First, flush any buffered events
    await this.flushBuffer();

    // Read from local log file
    const localEvents = await this.readLocalEvents(query);
    
    // If CloudWatch is enabled, also query CloudWatch
    if (this.cloudWatchEnabled) {
      const cloudWatchEvents = await this.queryCloudWatchEvents(query);
      return this.mergeAndDeduplicateEvents(localEvents, cloudWatchEvents);
    }

    return localEvents;
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(startTime: Date, endTime: Date): Promise<ComplianceReport> {
    const events = await this.queryEvents({ startTime, endTime });
    
    const summary = {
      totalEvents: events.length,
      userActions: events.filter(e => e.actor.type === 'user').length,
      noWingActions: events.filter(e => e.actor.type === 'no-wing').length,
      errors: events.filter(e => !e.result.success).length,
      permissionRequests: events.filter(e => e.eventType === 'permission-request').length
    };

    const violations = this.detectComplianceViolations(events);

    return {
      reportId: this.generateEventId(),
      generatedAt: new Date(),
      period: { startTime, endTime },
      summary,
      events,
      violations
    };
  }

  /**
   * Verify CloudTrail integration
   */
  async verifyCloudTrailIntegration(): Promise<{
    isConfigured: boolean;
    recentEvents: number;
    lastEventTime?: Date;
    errors: string[];
  }> {
    const errors: string[] = [];
    let recentEvents = 0;
    let lastEventTime: Date | undefined;

    try {
      const cloudTrailClient = new CloudTrailClient({
        credentials: this.credentialManager.getCurrentCredentials(),
        region: 'us-east-1'
      });

      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours

      const command = new LookupEventsCommand({
        StartTime: startTime,
        EndTime: endTime,
        MaxItems: 50
      });

      const response = await cloudTrailClient.send(command);
      
      if (response.Events) {
        recentEvents = response.Events.length;
        if (response.Events.length > 0 && response.Events[0].EventTime) {
          lastEventTime = response.Events[0].EventTime;
        }
      }

      return {
        isConfigured: true,
        recentEvents,
        lastEventTime,
        errors
      };
    } catch (error) {
      errors.push(`CloudTrail verification failed: ${error.message}`);
      return {
        isConfigured: false,
        recentEvents: 0,
        errors
      };
    }
  }

  /**
   * Flush buffered events
   */
  async flushBuffer(): Promise<void> {
    if (this.eventBuffer.length === 0) {
      return;
    }

    const eventsToFlush = [...this.eventBuffer];
    this.eventBuffer = [];

    // Write to local log
    await this.writeToLocalLog(eventsToFlush);

    // Write to CloudWatch if enabled
    if (this.cloudWatchEnabled) {
      await this.writeToCloudWatch(eventsToFlush);
    }

    console.log(`📤 Flushed ${eventsToFlush.length} audit events`);
  }

  /**
   * Private helper methods
   */
  private generateEventId(): string {
    return `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCorrelationId(): string {
    return `corr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private ensureLogDirectory(): void {
    const logDir = path.dirname(this.logFilePath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  private writeToLocalLog(events: AuditEvent | AuditEvent[]): Promise<void> {
    const eventsArray = Array.isArray(events) ? events : [events];
    
    const logEntries = eventsArray.map(event => 
      JSON.stringify(event) + '\n'
    ).join('');

    fs.appendFileSync(this.logFilePath, logEntries);
  }

  private async writeToCloudWatch(events: AuditEvent[]): Promise<void> {
    if (!this.cloudWatchLogGroup || !this.cloudWatchLogStream) {
      return;
    }

    try {
      const cloudWatchClient = new CloudWatchLogsClient({
        credentials: this.credentialManager.getCurrentCredentials(),
        region: 'us-east-1'
      });

      const logEvents = events.map(event => ({
        timestamp: event.timestamp.getTime(),
        message: JSON.stringify(event)
      }));

      const command = new PutLogEventsCommand({
        logGroupName: this.cloudWatchLogGroup,
        logStreamName: this.cloudWatchLogStream,
        logEvents
      });

      await cloudWatchClient.send(command);
    } catch (error) {
      console.error('❌ Failed to write to CloudWatch:', error.message);
    }
  }

  private readLocalEvents(query: AuditQuery): Promise<AuditEvent[]> {
    if (!fs.existsSync(this.logFilePath)) {
      return [];
    }

    const logContent = fs.readFileSync(this.logFilePath, 'utf8');
    const lines = logContent.split('\n').filter(line => line.trim());
    
    const events: AuditEvent[] = [];
    
    for (const line of lines) {
      try {
        const event = JSON.parse(line) as AuditEvent;
        event.timestamp = new Date(event.timestamp);
        
        if (this.matchesQuery(event, query)) {
          events.push(event);
        }
      } catch (error) {
        console.warn('⚠️ Failed to parse audit log line:', error.message);
      }
    }

    return events.slice(0, query.limit || 1000);
  }

  private queryCloudWatchEvents(_query: AuditQuery): Promise<AuditEvent[]> {
    // CloudWatch Logs query implementation would go here
    // For now, return empty array
    return [];
  }

  private mergeAndDeduplicateEvents(local: AuditEvent[], cloudWatch: AuditEvent[]): AuditEvent[] {
    const eventMap = new Map<string, AuditEvent>();
    
    // Add local events
    for (const event of local) {
      eventMap.set(event.id, event);
    }
    
    // Add CloudWatch events (they take precedence)
    for (const event of cloudWatch) {
      eventMap.set(event.id, event);
    }
    
    return Array.from(eventMap.values()).sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  private matchesQuery(event: AuditEvent, query: AuditQuery): boolean {
    if (query.startTime && event.timestamp < query.startTime) return false;
    if (query.endTime && event.timestamp > query.endTime) return false;
    if (query.eventTypes && !query.eventTypes.includes(event.eventType)) return false;
    if (query.actorTypes && !query.actorTypes.includes(event.actor.type)) return false;
    if (query.services && !query.services.includes(event.operation.service)) return false;
    if (query.success !== undefined && event.result.success !== query.success) return false;
    
    return true;
  }

  private detectComplianceViolations(events: AuditEvent[]): ComplianceViolation[] {
    const violations: ComplianceViolation[] = [];
    
    // Check for unauthorized access patterns
    const failedOperations = events.filter(e => !e.result.success);
    for (const event of failedOperations) {
      if (event.result.errorMessage?.includes('AccessDenied')) {
        violations.push({
          id: this.generateEventId(),
          type: 'unauthorized-access',
          severity: 'medium',
          description: `Unauthorized access attempt: ${event.operation.action}`,
          event,
          recommendation: 'Review IAM policies and ensure proper permissions are configured'
        });
      }
    }
    
    // Check for permission escalation
    const roleAssumptions = events.filter(e => e.eventType === 'role-assumption');
    for (const event of roleAssumptions) {
      if (event.operation.resources?.[0]?.includes('admin')) {
        violations.push({
          id: this.generateEventId(),
          type: 'permission-escalation',
          severity: 'high',
          description: `Admin role assumption detected: ${event.operation.resources[0]}`,
          event,
          recommendation: 'Use least-privilege roles instead of admin roles'
        });
      }
    }
    
    return violations;
  }

  private sanitizeParameters(params: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...params };
    
    // Remove sensitive data
    const sensitiveKeys = ['password', 'secret', 'key', 'token', 'credential'];
    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  private sanitizeResponseData(data: unknown): unknown {
    if (!data) return data;
    
    // Basic sanitization - in production, this would be more sophisticated
    const sanitized = JSON.parse(JSON.stringify(data));
    return sanitized;
  }

  private classifyDataByService(service: string): string {
    const classifications: Record<string, string> = {
      'iam': 'confidential',
      'sts': 'confidential',
      's3': 'internal',
      'lambda': 'internal',
      'cloudformation': 'internal'
    };
    
    return classifications[service] || 'internal';
  }

  private getRetentionPeriodByService(service: string): number {
    const retentionPeriods: Record<string, number> = {
      'iam': 2555, // 7 years
      'sts': 2555, // 7 years
      's3': 1095,  // 3 years
      'lambda': 1095, // 3 years
      'cloudformation': 1095 // 3 years
    };
    
    return retentionPeriods[service] || 365; // 1 year default
  }
}
