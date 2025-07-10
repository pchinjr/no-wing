import { S3Client } from '@aws-sdk/client-s3';
import { CloudFormationClient } from '@aws-sdk/client-cloudformation';
import { LambdaClient } from '@aws-sdk/client-lambda';
import { IAMClient } from '@aws-sdk/client-iam';
import { STSClient } from '@aws-sdk/client-sts';
import { CredentialManager } from './CredentialManager';
export type AWSServiceType = 's3' | 'cloudformation' | 'lambda' | 'iam' | 'sts';
export interface ClientConfig {
    region?: string;
    maxAttempts?: number;
    requestTimeout?: number;
}
export declare class AWSClientFactory {
    private credentialManager;
    private clientCache;
    private defaultRegion;
    constructor(credentialManager: CredentialManager, defaultRegion?: string);
    /**
     * Get an AWS service client with current credentials
     */
    getClient<T>(serviceType: AWSServiceType, config?: ClientConfig): Promise<T>;
    /**
     * Create a new AWS service client
     */
    private createClient;
    /**
     * Validate that a cached client is still valid
     */
    private isClientValid;
    /**
     * Clear all cached clients (useful when credentials change)
     */
    clearCache(): void;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        size: number;
        keys: string[];
    };
    /**
     * Create a client with specific credentials (bypass credential manager)
     */
    createClientWithCredentials<T>(serviceType: AWSServiceType, credentials: any, config?: ClientConfig): Promise<T>;
    /**
     * Helper method to get commonly used clients
     */
    getS3Client(config?: ClientConfig): Promise<S3Client>;
    getCloudFormationClient(config?: ClientConfig): Promise<CloudFormationClient>;
    getLambdaClient(config?: ClientConfig): Promise<LambdaClient>;
    getIAMClient(config?: ClientConfig): Promise<IAMClient>;
    getSTSClient(config?: ClientConfig): Promise<STSClient>;
    /**
     * Execute a function with a specific credential context
     */
    withContext<T>(contextType: 'user' | 'no-wing', operation: () => Promise<T>): Promise<T>;
    /**
     * Execute a deployment operation with no-wing credentials
     */
    executeAsNoWing<T>(operation: () => Promise<T>): Promise<T>;
    /**
     * Execute a user operation with user credentials
     */
    executeAsUser<T>(operation: () => Promise<T>): Promise<T>;
}
//# sourceMappingURL=AWSClientFactory.d.ts.map