import { CredentialManager } from '../credentials/CredentialManager';
export interface RoleInfo {
    roleName: string;
    roleArn: string;
    description?: string;
    maxSessionDuration: number;
    assumeRolePolicyDocument: string;
    tags?: Record<string, string>;
}
export interface RoleSession {
    roleArn: string;
    sessionName: string;
    credentials: {
        accessKeyId: string;
        secretAccessKey: string;
        sessionToken: string;
    };
    expiration: Date;
    assumedAt: Date;
}
export interface OperationContext {
    operation: string;
    service: string;
    resources?: string[];
    tags?: Record<string, string>;
}
export declare class RoleManager {
    private credentialManager;
    private roleCache;
    private sessionCache;
    private rolePatterns;
    constructor(credentialManager: CredentialManager);
    /**
     * Initialize common role patterns for different operations
     */
    private initializeRolePatterns;
    /**
     * Find the best role for a given operation
     */
    findBestRole(context: OperationContext): Promise<string | null>;
    /**
     * Assume a role with automatic session management
     */
    assumeRoleForOperation(context: OperationContext, roleArn?: string): Promise<RoleSession | null>;
    /**
     * Assume a specific role
     */
    private assumeRole;
    /**
     * List available roles that can be assumed
     */
    listAvailableRoles(): Promise<RoleInfo[]>;
    /**
     * Check if a role session is still valid
     */
    private isSessionValid;
    /**
     * Check if a role name matches a pattern
     */
    private matchesPattern;
    /**
     * Calculate specificity score for role matching
     */
    private calculateSpecificity;
    /**
     * Get current active sessions
     */
    getActiveSessions(): RoleSession[];
    /**
     * Clean up expired sessions
     */
    cleanupExpiredSessions(): void;
    /**
     * Clear all cached data
     */
    clearCache(): void;
    /**
     * Get role information
     */
    getRoleInfo(roleArn: string): Promise<RoleInfo | null>;
    /**
     * Test if a role can be assumed
     */
    testRoleAssumption(roleArn: string): Promise<boolean>;
}
//# sourceMappingURL=RoleManager.d.ts.map