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
        parameters?: Record<string, any>;
    };
    result: {
        success: boolean;
        errorMessage?: string;
        responseData?: any;
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
export declare class AuditLogger {
    private credentialManager;
    private logFilePath;
    private cloudWatchEnabled;
    private cloudWatchLogGroup?;
    private cloudWatchLogStream?;
    private eventBuffer;
    private bufferSize;
    private correlationId;
    constructor(credentialManager: CredentialManager, options?: {
        logFilePath?: string;
        cloudWatchLogGroup?: string;
        cloudWatchLogStream?: string;
        bufferSize?: number;
    });
    /**
     * Log an audit event
     */
    logEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<void>;
    /**
     * Log credential context switch
     */
    logCredentialSwitch(fromContext: string, toContext: string, success: boolean, error?: string): Promise<void>;
    /**
     * Log role assumption
     */
    logRoleAssumption(roleArn: string, sessionName: string, success: boolean, error?: string): Promise<void>;
    /**
     * Log AWS operation
     */
    logAWSOperation(service: string, action: string, resources: string[], parameters: Record<string, any>, success: boolean, error?: string, responseData?: any): Promise<void>;
    /**
     * Log permission request
     */
    logPermissionRequest(operation: string, actions: string[], resources: string[], justification: string, requestId: string, status: string): Promise<void>;
    /**
     * Query audit events
     */
    queryEvents(query: AuditQuery): Promise<AuditEvent[]>;
    /**
     * Generate compliance report
     */
    generateComplianceReport(startTime: Date, endTime: Date): Promise<ComplianceReport>;
    /**
     * Verify CloudTrail integration
     */
    verifyCloudTrailIntegration(): Promise<{
        isConfigured: boolean;
        recentEvents: number;
        lastEventTime?: Date;
        errors: string[];
    }>;
    /**
     * Flush buffered events
     */
    flushBuffer(): Promise<void>;
    /**
     * Private helper methods
     */
    private generateEventId;
    private generateCorrelationId;
    private ensureLogDirectory;
    private writeToLocalLog;
    private writeToCloudWatch;
    private readLocalEvents;
    private queryCloudWatchEvents;
    private mergeAndDeduplicateEvents;
    private matchesQuery;
    private detectComplianceViolations;
    private sanitizeParameters;
    private sanitizeResponseData;
    private classifyDataByService;
    private getRetentionPeriodByService;
}
//# sourceMappingURL=AuditLogger.d.ts.map