import * as fs from 'fs';
import * as path from 'path';
import { CloudWatchLogsClient, PutLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { CloudTrailClient, LookupEventsCommand } from '@aws-sdk/client-cloudtrail';
export class AuditLogger {
    credentialManager;
    logFilePath;
    cloudWatchEnabled;
    cloudWatchLogGroup;
    cloudWatchLogStream;
    eventBuffer = [];
    bufferSize = 100;
    correlationId;
    constructor(credentialManager, options = {}) {
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
    async logEvent(event) {
        const auditEvent = {
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
    async logCredentialSwitch(fromContext, toContext, success, error) {
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
    async logRoleAssumption(roleArn, sessionName, success, error) {
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
    async logAWSOperation(service, action, resources, parameters, success, error, responseData) {
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
    async logPermissionRequest(operation, actions, resources, justification, requestId, status) {
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
    async queryEvents(query) {
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
    async generateComplianceReport(startTime, endTime) {
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
    async verifyCloudTrailIntegration() {
        const errors = [];
        let recentEvents = 0;
        let lastEventTime;
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
        }
        catch (error) {
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
    async flushBuffer() {
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
    generateEventId() {
        return `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    generateCorrelationId() {
        return `corr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    ensureLogDirectory() {
        const logDir = path.dirname(this.logFilePath);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    }
    async writeToLocalLog(events) {
        const eventsArray = Array.isArray(events) ? events : [events];
        const logEntries = eventsArray.map(event => JSON.stringify(event) + '\n').join('');
        fs.appendFileSync(this.logFilePath, logEntries);
    }
    async writeToCloudWatch(events) {
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
        }
        catch (error) {
            console.error('❌ Failed to write to CloudWatch:', error.message);
        }
    }
    async readLocalEvents(query) {
        if (!fs.existsSync(this.logFilePath)) {
            return [];
        }
        const logContent = fs.readFileSync(this.logFilePath, 'utf8');
        const lines = logContent.split('\n').filter(line => line.trim());
        const events = [];
        for (const line of lines) {
            try {
                const event = JSON.parse(line);
                event.timestamp = new Date(event.timestamp);
                if (this.matchesQuery(event, query)) {
                    events.push(event);
                }
            }
            catch (error) {
                console.warn('⚠️ Failed to parse audit log line:', error.message);
            }
        }
        return events.slice(0, query.limit || 1000);
    }
    async queryCloudWatchEvents(query) {
        // CloudWatch Logs query implementation would go here
        // For now, return empty array
        return [];
    }
    mergeAndDeduplicateEvents(local, cloudWatch) {
        const eventMap = new Map();
        // Add local events
        for (const event of local) {
            eventMap.set(event.id, event);
        }
        // Add CloudWatch events (they take precedence)
        for (const event of cloudWatch) {
            eventMap.set(event.id, event);
        }
        return Array.from(eventMap.values()).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    matchesQuery(event, query) {
        if (query.startTime && event.timestamp < query.startTime)
            return false;
        if (query.endTime && event.timestamp > query.endTime)
            return false;
        if (query.eventTypes && !query.eventTypes.includes(event.eventType))
            return false;
        if (query.actorTypes && !query.actorTypes.includes(event.actor.type))
            return false;
        if (query.services && !query.services.includes(event.operation.service))
            return false;
        if (query.success !== undefined && event.result.success !== query.success)
            return false;
        return true;
    }
    detectComplianceViolations(events) {
        const violations = [];
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
    sanitizeParameters(params) {
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
    sanitizeResponseData(data) {
        if (!data)
            return data;
        // Basic sanitization - in production, this would be more sophisticated
        const sanitized = JSON.parse(JSON.stringify(data));
        return sanitized;
    }
    classifyDataByService(service) {
        const classifications = {
            'iam': 'confidential',
            'sts': 'confidential',
            's3': 'internal',
            'lambda': 'internal',
            'cloudformation': 'internal'
        };
        return classifications[service] || 'internal';
    }
    getRetentionPeriodByService(service) {
        const retentionPeriods = {
            'iam': 2555, // 7 years
            'sts': 2555, // 7 years
            's3': 1095, // 3 years
            'lambda': 1095, // 3 years
            'cloudformation': 1095 // 3 years
        };
        return retentionPeriods[service] || 365; // 1 year default
    }
}
//# sourceMappingURL=AuditLogger.js.map