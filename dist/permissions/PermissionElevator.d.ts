import { CredentialManager } from '../credentials/CredentialManager';
import { RoleManager, OperationContext } from './RoleManager';
import { ConfigManager } from '../config/ConfigManager';
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
    sessionInfo?: any;
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
export declare class PermissionElevator {
    private credentialManager;
    private roleManager;
    private configManager;
    private permissionRequests;
    private permissionPatterns;
    private learningData;
    constructor(credentialManager: CredentialManager, roleManager: RoleManager, configManager: ConfigManager);
    /**
     * Initialize common permission patterns for different operations
     */
    private initializePermissionPatterns;
    /**
     * Attempt to elevate permissions for an operation
     */
    elevatePermissions(context: OperationContext): Promise<ElevationResult>;
    /**
     * Check if current credentials have direct permissions
     */
    private checkDirectPermissions;
    /**
     * Try to assume an appropriate role
     */
    private tryRoleAssumption;
    /**
     * Try graceful degradation strategies
     */
    private tryGracefulDegradation;
    /**
     * Try a specific fallback strategy
     */
    private tryFallbackStrategy;
    /**
     * Try read-only validation as fallback
     */
    private tryReadOnlyValidation;
    /**
     * Try dry-run as fallback
     */
    private tryDryRun;
    /**
     * Request manual approval
     */
    private requestManualApproval;
    /**
     * Try staged deployment
     */
    private tryStagedDeployment;
    /**
     * Create a permission request
     */
    createPermissionRequest(context: OperationContext): Promise<ElevationResult>;
    /**
     * Generate justification for permission request
     */
    private generateJustification;
    /**
     * Check permission request status
     */
    getPermissionRequest(requestId: string): PermissionRequest | null;
    /**
     * Approve a permission request
     */
    approvePermissionRequest(requestId: string, approvedBy: string): boolean;
    /**
     * Learn from successful operations
     */
    learnFromSuccess(context: OperationContext, method: string): void;
    /**
     * Get learned patterns for an operation
     */
    getLearnedPatterns(context: OperationContext): string[];
    /**
     * Clean up expired permission requests
     */
    cleanupExpiredRequests(): void;
    /**
     * Get statistics about permission requests
     */
    getRequestStatistics(): {
        total: number;
        pending: number;
        approved: number;
        denied: number;
        expired: number;
    };
}
//# sourceMappingURL=PermissionElevator.d.ts.map