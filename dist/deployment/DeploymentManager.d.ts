import { CredentialManager } from '../credentials/CredentialManager';
import { AWSClientFactory } from '../credentials/AWSClientFactory';
import { PermissionElevator } from '../permissions/PermissionElevator';
import { AuditLogger } from '../audit/AuditLogger';
import { RoleManager } from '../permissions/RoleManager';
export interface DeploymentConfig {
    stackName: string;
    templatePath: string;
    parameters?: Record<string, string>;
    tags?: Record<string, string>;
    capabilities?: string[];
    region?: string;
    s3Bucket?: string;
    s3KeyPrefix?: string;
}
export interface DeploymentResult {
    success: boolean;
    stackId?: string;
    stackStatus?: string;
    outputs?: Record<string, string>;
    error?: string;
    duration: number;
    method: 'direct' | 'role-assumption' | 'manual-approval';
    auditTrail: string[];
}
export interface RollbackConfig {
    enabled: boolean;
    onFailure: 'ROLLBACK' | 'DELETE' | 'DO_NOTHING';
    retainResources?: string[];
}
export declare class DeploymentManager {
    private credentialManager;
    private clientFactory;
    private permissionElevator;
    private auditLogger;
    private roleManager;
    constructor(credentialManager: CredentialManager, clientFactory: AWSClientFactory, permissionElevator: PermissionElevator, auditLogger: AuditLogger, roleManager: RoleManager);
    /**
     * Deploy a CloudFormation stack with credential separation
     */
    deployStack(config: DeploymentConfig, rollbackConfig?: RollbackConfig): Promise<DeploymentResult>;
    /**
     * Rollback a deployment
     */
    rollbackDeployment(stackName: string, region?: string): Promise<DeploymentResult>;
    /**
     * Validate deployment with user credentials
     */
    validateDeployment(config: DeploymentConfig): Promise<{
        isValid: boolean;
        errors: string[];
        warnings: string[];
        recommendations: string[];
    }>;
    /**
     * Private helper methods
     */
    private uploadTemplate;
    private checkStackExists;
    private createStack;
    private updateStack;
    private deleteStack;
    private cancelStackUpdate;
    private waitForStackCompletion;
    private handleDeploymentFailure;
    private isLocalFile;
    private extractRequiredParameters;
}
//# sourceMappingURL=DeploymentManager.d.ts.map