import { STSClient } from '@aws-sdk/client-sts';
export interface CredentialContext {
    type: 'user' | 'no-wing';
    identity?: {
        arn: string;
        userId: string;
        account: string;
    };
    sessionToken?: string;
    expiration?: Date;
}
export interface NoWingCredentialConfig {
    accessKeyId?: string;
    secretAccessKey?: string;
    sessionToken?: string;
    roleArn?: string;
    profile?: string;
    region: string;
}
export declare class CredentialManager {
    private currentContext;
    private userCredentials;
    private noWingCredentials;
    private stsClient;
    private configPath;
    constructor(configPath?: string);
    /**
     * Initialize credential manager by detecting and validating available credentials
     */
    initialize(): Promise<void>;
    /**
     * Load user credentials from environment or AWS config
     */
    private loadUserCredentials;
    /**
     * Load no-wing credentials from configuration
     */
    private loadNoWingCredentials;
    /**
     * Switch to user credential context
     */
    switchToUserContext(): Promise<CredentialContext>;
    /**
     * Switch to no-wing credential context
     */
    switchToNoWingContext(): Promise<CredentialContext>;
    /**
     * Assume a role using current credentials
     */
    assumeRole(roleArn: string, sessionName?: string): Promise<CredentialContext>;
    /**
     * Get current credential context
     */
    getCurrentContext(): CredentialContext | null;
    /**
     * Get current STS client with active credentials
     */
    getStsClient(): STSClient;
    /**
     * Get credentials for use with other AWS SDK clients
     */
    getCurrentCredentials(): any;
    /**
     * Validate current credentials are still valid
     */
    validateCurrentCredentials(): Promise<boolean>;
    /**
     * Get a summary of current credential status
     */
    getCredentialStatus(): Promise<{
        context: CredentialContext | null;
        isValid: boolean;
        expiresAt?: Date;
    }>;
}
//# sourceMappingURL=CredentialManager.d.ts.map