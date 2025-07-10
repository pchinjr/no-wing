import { STSClient, AssumeRoleCommand, GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import { IAMClient, ListRolesCommand, GetRoleCommand } from '@aws-sdk/client-iam';
export class RoleManager {
    credentialManager;
    roleCache = new Map();
    sessionCache = new Map();
    rolePatterns = new Map();
    constructor(credentialManager) {
        this.credentialManager = credentialManager;
        this.initializeRolePatterns();
    }
    /**
     * Initialize common role patterns for different operations
     */
    initializeRolePatterns() {
        this.rolePatterns.set('deployment', [
            'no-wing-deploy-*',
            'no-wing-cloudformation-*',
            '*-deployment-role'
        ]);
        this.rolePatterns.set('s3', [
            'no-wing-s3-*',
            'no-wing-storage-*',
            '*-s3-access-role'
        ]);
        this.rolePatterns.set('lambda', [
            'no-wing-lambda-*',
            'no-wing-function-*',
            '*-lambda-execution-role'
        ]);
        this.rolePatterns.set('monitoring', [
            'no-wing-monitoring-*',
            'no-wing-cloudwatch-*',
            '*-monitoring-role'
        ]);
    }
    /**
     * Find the best role for a given operation
     */
    async findBestRole(context) {
        try {
            console.log(`🔍 Finding best role for operation: ${context.operation}`);
            // Get available roles
            const availableRoles = await this.listAvailableRoles();
            // Get patterns for this operation type
            const patterns = this.rolePatterns.get(context.service) ||
                this.rolePatterns.get(context.operation) ||
                ['no-wing-*'];
            // Find matching roles
            const matchingRoles = availableRoles.filter(role => patterns.some(pattern => this.matchesPattern(role.roleName, pattern)));
            if (matchingRoles.length === 0) {
                console.log(`⚠️ No matching roles found for ${context.operation}`);
                return null;
            }
            // Sort by specificity (more specific patterns first)
            matchingRoles.sort((a, b) => {
                const aSpecificity = this.calculateSpecificity(a.roleName, patterns);
                const bSpecificity = this.calculateSpecificity(b.roleName, patterns);
                return bSpecificity - aSpecificity;
            });
            const bestRole = matchingRoles[0];
            console.log(`✅ Best role found: ${bestRole.roleName}`);
            return bestRole.roleArn;
        }
        catch (error) {
            console.error(`❌ Error finding role for ${context.operation}:`, error.message);
            return null;
        }
    }
    /**
     * Assume a role with automatic session management
     */
    async assumeRoleForOperation(context, roleArn) {
        try {
            // Find role if not provided
            const targetRoleArn = roleArn || await this.findBestRole(context);
            if (!targetRoleArn) {
                console.log(`❌ No suitable role found for ${context.operation}`);
                return null;
            }
            // Check if we already have a valid session for this role
            const existingSession = this.sessionCache.get(targetRoleArn);
            if (existingSession && this.isSessionValid(existingSession)) {
                console.log(`♻️ Reusing existing session for ${targetRoleArn}`);
                return existingSession;
            }
            // Assume the role
            const session = await this.assumeRole(targetRoleArn, context);
            if (session) {
                // Cache the session
                this.sessionCache.set(targetRoleArn, session);
                console.log(`✅ Role assumed successfully: ${targetRoleArn}`);
            }
            return session;
        }
        catch (error) {
            console.error(`❌ Failed to assume role for ${context.operation}:`, error.message);
            return null;
        }
    }
    /**
     * Assume a specific role
     */
    async assumeRole(roleArn, context) {
        try {
            const stsClient = this.credentialManager.getStsClient();
            const sessionName = `no-wing-${context.operation}-${Date.now()}`;
            const command = new AssumeRoleCommand({
                RoleArn: roleArn,
                RoleSessionName: sessionName,
                DurationSeconds: 3600, // 1 hour
                Tags: context.tags ? Object.entries(context.tags).map(([Key, Value]) => ({ Key, Value })) : undefined
            });
            const response = await stsClient.send(command);
            if (!response.Credentials) {
                throw new Error('No credentials returned from assume role');
            }
            return {
                roleArn,
                sessionName,
                credentials: {
                    accessKeyId: response.Credentials.AccessKeyId,
                    secretAccessKey: response.Credentials.SecretAccessKey,
                    sessionToken: response.Credentials.SessionToken
                },
                expiration: response.Credentials.Expiration,
                assumedAt: new Date()
            };
        }
        catch (error) {
            console.error(`❌ Failed to assume role ${roleArn}:`, error.message);
            return null;
        }
    }
    /**
     * List available roles that can be assumed
     */
    async listAvailableRoles() {
        try {
            // Check cache first
            if (this.roleCache.size > 0) {
                return Array.from(this.roleCache.values());
            }
            const iamClient = new IAMClient({
                credentials: this.credentialManager.getCurrentCredentials(),
                region: 'us-east-1'
            });
            const command = new ListRolesCommand({
                PathPrefix: '/',
                MaxItems: 100
            });
            const response = await iamClient.send(command);
            const roles = [];
            for (const role of response.Roles || []) {
                if (role.RoleName && role.Arn) {
                    const roleInfo = {
                        roleName: role.RoleName,
                        roleArn: role.Arn,
                        description: role.Description,
                        maxSessionDuration: role.MaxSessionDuration || 3600,
                        assumeRolePolicyDocument: role.AssumeRolePolicyDocument || ''
                    };
                    // Extract tags if available
                    if (role.Tags) {
                        roleInfo.tags = {};
                        for (const tag of role.Tags) {
                            if (tag.Key && tag.Value) {
                                roleInfo.tags[tag.Key] = tag.Value;
                            }
                        }
                    }
                    roles.push(roleInfo);
                    this.roleCache.set(role.RoleName, roleInfo);
                }
            }
            console.log(`📋 Found ${roles.length} available roles`);
            return roles;
        }
        catch (error) {
            console.error('❌ Failed to list available roles:', error.message);
            return [];
        }
    }
    /**
     * Check if a role session is still valid
     */
    isSessionValid(session) {
        const now = new Date();
        const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
        return session.expiration.getTime() > (now.getTime() + bufferTime);
    }
    /**
     * Check if a role name matches a pattern
     */
    matchesPattern(roleName, pattern) {
        // Convert glob pattern to regex
        const regexPattern = pattern
            .replace(/\*/g, '.*')
            .replace(/\?/g, '.');
        const regex = new RegExp(`^${regexPattern}$`, 'i');
        return regex.test(roleName);
    }
    /**
     * Calculate specificity score for role matching
     */
    calculateSpecificity(roleName, patterns) {
        let maxSpecificity = 0;
        for (const pattern of patterns) {
            if (this.matchesPattern(roleName, pattern)) {
                // More specific patterns (fewer wildcards) get higher scores
                const wildcardCount = (pattern.match(/\*/g) || []).length;
                const specificity = pattern.length - (wildcardCount * 2);
                maxSpecificity = Math.max(maxSpecificity, specificity);
            }
        }
        return maxSpecificity;
    }
    /**
     * Get current active sessions
     */
    getActiveSessions() {
        const activeSessions = [];
        for (const session of this.sessionCache.values()) {
            if (this.isSessionValid(session)) {
                activeSessions.push(session);
            }
        }
        return activeSessions;
    }
    /**
     * Clean up expired sessions
     */
    cleanupExpiredSessions() {
        const expiredKeys = [];
        for (const [key, session] of this.sessionCache.entries()) {
            if (!this.isSessionValid(session)) {
                expiredKeys.push(key);
            }
        }
        for (const key of expiredKeys) {
            this.sessionCache.delete(key);
        }
        if (expiredKeys.length > 0) {
            console.log(`🧹 Cleaned up ${expiredKeys.length} expired sessions`);
        }
    }
    /**
     * Clear all cached data
     */
    clearCache() {
        this.roleCache.clear();
        this.sessionCache.clear();
        console.log('🧹 Role manager cache cleared');
    }
    /**
     * Get role information
     */
    async getRoleInfo(roleArn) {
        try {
            const roleName = roleArn.split('/').pop();
            if (!roleName) {
                throw new Error('Invalid role ARN');
            }
            // Check cache first
            if (this.roleCache.has(roleName)) {
                return this.roleCache.get(roleName);
            }
            // Fetch from AWS
            const iamClient = new IAMClient({
                credentials: this.credentialManager.getCurrentCredentials(),
                region: 'us-east-1'
            });
            const command = new GetRoleCommand({ RoleName: roleName });
            const response = await iamClient.send(command);
            if (response.Role) {
                const roleInfo = {
                    roleName: response.Role.RoleName,
                    roleArn: response.Role.Arn,
                    description: response.Role.Description,
                    maxSessionDuration: response.Role.MaxSessionDuration || 3600,
                    assumeRolePolicyDocument: response.Role.AssumeRolePolicyDocument || ''
                };
                this.roleCache.set(roleName, roleInfo);
                return roleInfo;
            }
            return null;
        }
        catch (error) {
            console.error(`❌ Failed to get role info for ${roleArn}:`, error.message);
            return null;
        }
    }
    /**
     * Test if a role can be assumed
     */
    async testRoleAssumption(roleArn) {
        try {
            const testContext = {
                operation: 'test',
                service: 'sts'
            };
            const session = await this.assumeRole(roleArn, testContext);
            if (session) {
                // Test the assumed credentials
                const testSTS = new STSClient({
                    credentials: session.credentials,
                    region: 'us-east-1'
                });
                await testSTS.send(new GetCallerIdentityCommand({}));
                console.log(`✅ Role assumption test successful: ${roleArn}`);
                return true;
            }
            return false;
        }
        catch (error) {
            console.error(`❌ Role assumption test failed for ${roleArn}:`, error.message);
            return false;
        }
    }
}
//# sourceMappingURL=RoleManager.js.map