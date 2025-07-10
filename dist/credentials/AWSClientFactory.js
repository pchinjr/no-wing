import { S3Client } from '@aws-sdk/client-s3';
import { CloudFormationClient } from '@aws-sdk/client-cloudformation';
import { LambdaClient } from '@aws-sdk/client-lambda';
import { IAMClient } from '@aws-sdk/client-iam';
import { STSClient } from '@aws-sdk/client-sts';
export class AWSClientFactory {
    credentialManager;
    clientCache = new Map();
    defaultRegion;
    constructor(credentialManager, defaultRegion = 'us-east-1') {
        this.credentialManager = credentialManager;
        this.defaultRegion = defaultRegion;
    }
    /**
     * Get an AWS service client with current credentials
     */
    async getClient(serviceType, config = {}) {
        const context = this.credentialManager.getCurrentContext();
        if (!context) {
            throw new Error('No credential context available. Call credentialManager.initialize() first.');
        }
        const cacheKey = `${serviceType}-${context.type}-${config.region || this.defaultRegion}`;
        // Check cache first
        if (this.clientCache.has(cacheKey)) {
            const cachedClient = this.clientCache.get(cacheKey);
            // Validate cached client is still valid
            if (await this.isClientValid(cachedClient, serviceType)) {
                return cachedClient;
            }
            else {
                // Remove invalid client from cache
                this.clientCache.delete(cacheKey);
            }
        }
        // Create new client
        const client = await this.createClient(serviceType, config);
        // Cache the client
        this.clientCache.set(cacheKey, client);
        return client;
    }
    /**
     * Create a new AWS service client
     */
    async createClient(serviceType, config) {
        const credentials = this.credentialManager.getCurrentCredentials();
        const region = config.region || this.defaultRegion;
        const clientConfig = {
            credentials,
            region,
            maxAttempts: config.maxAttempts || 3,
            requestTimeout: config.requestTimeout || 30000
        };
        switch (serviceType) {
            case 's3':
                return new S3Client(clientConfig);
            case 'cloudformation':
                return new CloudFormationClient(clientConfig);
            case 'lambda':
                return new LambdaClient(clientConfig);
            case 'iam':
                return new IAMClient(clientConfig);
            case 'sts':
                return new STSClient(clientConfig);
            default:
                throw new Error(`Unsupported service type: ${serviceType}`);
        }
    }
    /**
     * Validate that a cached client is still valid
     */
    async isClientValid(client, serviceType) {
        try {
            // Simple validation call for each service type
            switch (serviceType) {
                case 's3':
                    await client.send(new (await import('@aws-sdk/client-s3')).ListBucketsCommand({}));
                    break;
                case 'cloudformation':
                    await client.send(new (await import('@aws-sdk/client-cloudformation')).ListStacksCommand({ StackStatusFilter: ['CREATE_COMPLETE'] }));
                    break;
                case 'lambda':
                    await client.send(new (await import('@aws-sdk/client-lambda')).ListFunctionsCommand({ MaxItems: 1 }));
                    break;
                case 'iam':
                    await client.send(new (await import('@aws-sdk/client-iam')).GetUserCommand({}));
                    break;
                case 'sts':
                    await client.send(new (await import('@aws-sdk/client-sts')).GetCallerIdentityCommand({}));
                    break;
                default:
                    return false;
            }
            return true;
        }
        catch (error) {
            console.warn(`⚠️ Client validation failed for ${serviceType}:`, error.message);
            return false;
        }
    }
    /**
     * Clear all cached clients (useful when credentials change)
     */
    clearCache() {
        this.clientCache.clear();
        console.log('🧹 AWS client cache cleared');
    }
    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.clientCache.size,
            keys: Array.from(this.clientCache.keys())
        };
    }
    /**
     * Create a client with specific credentials (bypass credential manager)
     */
    async createClientWithCredentials(serviceType, credentials, config = {}) {
        const region = config.region || this.defaultRegion;
        const clientConfig = {
            credentials,
            region,
            maxAttempts: config.maxAttempts || 3,
            requestTimeout: config.requestTimeout || 30000
        };
        switch (serviceType) {
            case 's3':
                return new S3Client(clientConfig);
            case 'cloudformation':
                return new CloudFormationClient(clientConfig);
            case 'lambda':
                return new LambdaClient(clientConfig);
            case 'iam':
                return new IAMClient(clientConfig);
            case 'sts':
                return new STSClient(clientConfig);
            default:
                throw new Error(`Unsupported service type: ${serviceType}`);
        }
    }
    /**
     * Helper method to get commonly used clients
     */
    async getS3Client(config) {
        return this.getClient('s3', config);
    }
    async getCloudFormationClient(config) {
        return this.getClient('cloudformation', config);
    }
    async getLambdaClient(config) {
        return this.getClient('lambda', config);
    }
    async getIAMClient(config) {
        return this.getClient('iam', config);
    }
    async getSTSClient(config) {
        return this.getClient('sts', config);
    }
    /**
     * Execute a function with a specific credential context
     */
    async withContext(contextType, operation) {
        const originalContext = this.credentialManager.getCurrentContext();
        try {
            // Switch to requested context
            if (contextType === 'user') {
                await this.credentialManager.switchToUserContext();
            }
            else {
                await this.credentialManager.switchToNoWingContext();
            }
            // Clear cache since credentials changed
            this.clearCache();
            // Execute operation
            const result = await operation();
            return result;
        }
        finally {
            // Restore original context
            if (originalContext) {
                if (originalContext.type === 'user') {
                    await this.credentialManager.switchToUserContext();
                }
                else {
                    await this.credentialManager.switchToNoWingContext();
                }
                this.clearCache();
            }
        }
    }
    /**
     * Execute a deployment operation with no-wing credentials
     */
    async executeAsNoWing(operation) {
        return this.withContext('no-wing', operation);
    }
    /**
     * Execute a user operation with user credentials
     */
    async executeAsUser(operation) {
        return this.withContext('user', operation);
    }
}
//# sourceMappingURL=AWSClientFactory.js.map