export interface NoWingConfig {
    developerId: string;
    qId: string;
    qLevel: string;
    region: string;
    setupDate: string;
    credentials?: {
        accessKeyId?: string;
        secretAccessKey?: string;
        sessionToken?: string;
        roleArn?: string;
        profile?: string;
        region: string;
    };
    permissions?: {
        requiredPolicies: string[];
        optionalPolicies: string[];
        customPolicies: PolicyDocument[];
    };
    audit?: {
        enabled: boolean;
        cloudTrailArn?: string;
        logGroupName?: string;
    };
}
export interface PolicyDocument {
    Version: string;
    Statement: PolicyStatement[];
}
export interface PolicyStatement {
    Effect: 'Allow' | 'Deny';
    Action: string | string[];
    Resource: string | string[];
    Condition?: Record<string, any>;
}
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    recommendations: string[];
}
export declare class ConfigManager {
    private configPath;
    private config;
    constructor(configPath?: string);
    /**
     * Load configuration from file
     */
    loadConfig(): Promise<NoWingConfig>;
    /**
     * Save configuration to file
     */
    saveConfig(config: NoWingConfig): Promise<void>;
    /**
     * Get current configuration
     */
    getConfig(): NoWingConfig | null;
    /**
     * Update credential configuration
     */
    updateCredentials(credentials: NoWingConfig['credentials']): Promise<void>;
    /**
     * Validate no-wing IAM setup
     */
    validateIAMSetup(): Promise<ValidationResult>;
    /**
     * Validate user permissions
     */
    private validateUserPermissions;
    /**
     * Validate role permissions
     */
    private validateRolePermissions;
    /**
     * Check for overly permissive policies
     */
    private checkForOverlyPermissivePolicies;
    /**
     * Validate audit configuration
     */
    private validateAuditConfiguration;
    /**
     * Generate a minimal IAM policy for no-wing
     */
    generateMinimalPolicy(): PolicyDocument;
    /**
     * Generate deployment-specific policy
     */
    generateDeploymentPolicy(): PolicyDocument;
    /**
     * Create default configuration
     */
    static createDefaultConfig(developerId: string, region?: string): NoWingConfig;
    /**
     * Migrate old configuration format
     */
    migrateConfig(): Promise<void>;
}
//# sourceMappingURL=ConfigManager.d.ts.map