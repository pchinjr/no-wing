import { CreateStackCommand, UpdateStackCommand, DescribeStacksCommand, DeleteStackCommand } from '@aws-sdk/client-cloudformation';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
export class DeploymentManager {
    credentialManager;
    clientFactory;
    permissionElevator;
    auditLogger;
    roleManager;
    constructor(credentialManager, clientFactory, permissionElevator, auditLogger, roleManager) {
        this.credentialManager = credentialManager;
        this.clientFactory = clientFactory;
        this.permissionElevator = permissionElevator;
        this.auditLogger = auditLogger;
        this.roleManager = roleManager;
    }
    /**
     * Deploy a CloudFormation stack with credential separation
     */
    async deployStack(config, rollbackConfig) {
        const startTime = Date.now();
        const auditTrail = [];
        console.log(`🚀 Starting deployment: ${config.stackName}`);
        auditTrail.push(`Deployment started: ${config.stackName}`);
        try {
            // Step 1: Switch to no-wing context for deployment
            await this.credentialManager.switchToNoWingContext();
            await this.auditLogger.logCredentialSwitch('user', 'no-wing', true);
            auditTrail.push('Switched to no-wing credentials');
            // Step 2: Prepare deployment context
            const deploymentContext = {
                operation: 'cloudformation-deploy',
                service: 'cloudformation',
                resources: [
                    `arn:aws:cloudformation:${config.region || 'us-east-1'}:*:stack/${config.stackName}/*`
                ],
                tags: config.tags
            };
            // Step 3: Elevate permissions for deployment
            const elevationResult = await this.permissionElevator.elevatePermissions(deploymentContext);
            auditTrail.push(`Permission elevation: ${elevationResult.method} - ${elevationResult.success ? 'Success' : 'Failed'}`);
            if (!elevationResult.success) {
                return this.handleDeploymentFailure(config, `Permission elevation failed: ${elevationResult.message}`, startTime, auditTrail, elevationResult.method);
            }
            // Step 4: Upload template to S3 if needed
            let templateUrl = config.templatePath;
            if (config.s3Bucket && this.isLocalFile(config.templatePath)) {
                templateUrl = await this.uploadTemplate(config);
                auditTrail.push(`Template uploaded to S3: ${templateUrl}`);
            }
            // Step 5: Check if stack exists
            const stackExists = await this.checkStackExists(config.stackName, config.region);
            auditTrail.push(`Stack exists check: ${stackExists}`);
            // Step 6: Deploy or update stack
            let result;
            if (stackExists) {
                result = await this.updateStack(config, templateUrl, auditTrail);
            }
            else {
                result = await this.createStack(config, templateUrl, rollbackConfig, auditTrail);
            }
            // Step 7: Wait for completion and get outputs
            if (result.success && result.stackId) {
                const finalStatus = await this.waitForStackCompletion(result.stackId, config.region);
                result.stackStatus = finalStatus.status;
                result.outputs = finalStatus.outputs;
                auditTrail.push(`Stack deployment completed: ${finalStatus.status}`);
            }
            result.duration = Date.now() - startTime;
            result.auditTrail = auditTrail;
            result.method = elevationResult.method;
            // Log final deployment result
            await this.auditLogger.logAWSOperation('cloudformation', stackExists ? 'UpdateStack' : 'CreateStack', deploymentContext.resources || [], { StackName: config.stackName }, result.success, result.error);
            return result;
        }
        catch (error) {
            return this.handleDeploymentFailure(config, error.message, startTime, auditTrail, 'direct');
        }
    }
    /**
     * Rollback a deployment
     */
    async rollbackDeployment(stackName, region) {
        const startTime = Date.now();
        const auditTrail = [];
        console.log(`🔄 Starting rollback: ${stackName}`);
        auditTrail.push(`Rollback started: ${stackName}`);
        try {
            // Switch to no-wing context
            await this.credentialManager.switchToNoWingContext();
            auditTrail.push('Switched to no-wing credentials for rollback');
            // Get CloudFormation client
            const cfClient = await this.clientFactory.getCloudFormationClient({ region });
            // Check current stack status
            const describeCommand = new DescribeStacksCommand({ StackName: stackName });
            const stackInfo = await cfClient.send(describeCommand);
            if (!stackInfo.Stacks || stackInfo.Stacks.length === 0) {
                throw new Error(`Stack not found: ${stackName}`);
            }
            const currentStatus = stackInfo.Stacks[0].StackStatus;
            auditTrail.push(`Current stack status: ${currentStatus}`);
            // Determine rollback strategy based on current status
            let rollbackResult;
            if (currentStatus?.includes('ROLLBACK')) {
                // Stack is already in rollback state
                rollbackResult = await this.waitForStackCompletion(stackInfo.Stacks[0].StackId, region);
                auditTrail.push('Stack already in rollback state, waiting for completion');
            }
            else if (currentStatus?.includes('FAILED')) {
                // Delete failed stack
                rollbackResult = await this.deleteStack(stackName, region, auditTrail);
            }
            else {
                // Cancel update and rollback
                rollbackResult = await this.cancelStackUpdate(stackName, region, auditTrail);
            }
            rollbackResult.duration = Date.now() - startTime;
            rollbackResult.auditTrail = auditTrail;
            // Log rollback operation
            await this.auditLogger.logAWSOperation('cloudformation', 'RollbackStack', [`arn:aws:cloudformation:${region || 'us-east-1'}:*:stack/${stackName}/*`], { StackName: stackName }, rollbackResult.success, rollbackResult.error);
            return rollbackResult;
        }
        catch (error) {
            return this.handleDeploymentFailure({ stackName }, `Rollback failed: ${error.message}`, startTime, auditTrail, 'direct');
        }
    }
    /**
     * Validate deployment with user credentials
     */
    async validateDeployment(config) {
        console.log(`🔍 Validating deployment: ${config.stackName}`);
        const result = {
            isValid: true,
            errors: [],
            warnings: [],
            recommendations: []
        };
        try {
            // Switch to user context for validation
            await this.credentialManager.switchToUserContext();
            // Validate template file exists
            if (this.isLocalFile(config.templatePath) && !fs.existsSync(config.templatePath)) {
                result.errors.push(`Template file not found: ${config.templatePath}`);
                result.isValid = false;
            }
            // Validate template syntax
            if (this.isLocalFile(config.templatePath)) {
                const templateContent = fs.readFileSync(config.templatePath, 'utf8');
                try {
                    const template = JSON.parse(templateContent);
                    if (!template.AWSTemplateFormatVersion && !template.Resources) {
                        result.warnings.push('Template may not be a valid CloudFormation template');
                    }
                }
                catch (error) {
                    // Try YAML parsing if JSON fails
                    result.warnings.push('Template format validation skipped (requires YAML parser)');
                }
            }
            // Validate required parameters
            if (config.parameters) {
                const requiredParams = this.extractRequiredParameters(config.templatePath);
                for (const param of requiredParams) {
                    if (!config.parameters[param]) {
                        result.errors.push(`Missing required parameter: ${param}`);
                        result.isValid = false;
                    }
                }
            }
            // Validate S3 bucket access if specified
            if (config.s3Bucket) {
                try {
                    const s3Client = await this.clientFactory.getS3Client({ region: config.region });
                    // This would fail if bucket doesn't exist or no access
                    // await s3Client.send(new HeadBucketCommand({ Bucket: config.s3Bucket }));
                    result.recommendations.push('Verify S3 bucket access for template upload');
                }
                catch (error) {
                    result.warnings.push(`S3 bucket validation failed: ${error.message}`);
                }
            }
            // Validate stack naming conventions
            if (!config.stackName.startsWith('no-wing-')) {
                result.recommendations.push('Consider using "no-wing-" prefix for stack names');
            }
            // Log validation
            await this.auditLogger.logAWSOperation('cloudformation', 'ValidateTemplate', [`arn:aws:cloudformation:${config.region || 'us-east-1'}:*:stack/${config.stackName}/*`], { StackName: config.stackName }, result.isValid, result.isValid ? undefined : result.errors.join(', '));
        }
        catch (error) {
            result.errors.push(`Validation failed: ${error.message}`);
            result.isValid = false;
        }
        return result;
    }
    /**
     * Private helper methods
     */
    async uploadTemplate(config) {
        if (!config.s3Bucket) {
            throw new Error('S3 bucket required for template upload');
        }
        const s3Client = await this.clientFactory.getS3Client({ region: config.region });
        const templateContent = fs.readFileSync(config.templatePath, 'utf8');
        const key = `${config.s3KeyPrefix || 'templates'}/${config.stackName}-${Date.now()}.json`;
        const putCommand = new PutObjectCommand({
            Bucket: config.s3Bucket,
            Key: key,
            Body: templateContent,
            ContentType: 'application/json'
        });
        await s3Client.send(putCommand);
        return `https://${config.s3Bucket}.s3.amazonaws.com/${key}`;
    }
    async checkStackExists(stackName, region) {
        try {
            const cfClient = await this.clientFactory.getCloudFormationClient({ region });
            const command = new DescribeStacksCommand({ StackName: stackName });
            await cfClient.send(command);
            return true;
        }
        catch (error) {
            if (error.name === 'ValidationError') {
                return false;
            }
            throw error;
        }
    }
    async createStack(config, templateUrl, rollbackConfig, auditTrail = []) {
        const cfClient = await this.clientFactory.getCloudFormationClient({ region: config.region });
        const createCommand = new CreateStackCommand({
            StackName: config.stackName,
            TemplateURL: this.isLocalFile(templateUrl) ? undefined : templateUrl,
            TemplateBody: this.isLocalFile(templateUrl) ? fs.readFileSync(templateUrl, 'utf8') : undefined,
            Parameters: config.parameters ? Object.entries(config.parameters).map(([key, value]) => ({
                ParameterKey: key,
                ParameterValue: value
            })) : undefined,
            Tags: config.tags ? Object.entries(config.tags).map(([key, value]) => ({
                Key: key,
                Value: value
            })) : undefined,
            Capabilities: config.capabilities,
            OnFailure: rollbackConfig?.onFailure || 'ROLLBACK'
        });
        const response = await cfClient.send(createCommand);
        auditTrail.push(`Stack creation initiated: ${response.StackId}`);
        return {
            success: true,
            stackId: response.StackId,
            duration: 0,
            method: 'role-assumption',
            auditTrail
        };
    }
    async updateStack(config, templateUrl, auditTrail = []) {
        const cfClient = await this.clientFactory.getCloudFormationClient({ region: config.region });
        const updateCommand = new UpdateStackCommand({
            StackName: config.stackName,
            TemplateURL: this.isLocalFile(templateUrl) ? undefined : templateUrl,
            TemplateBody: this.isLocalFile(templateUrl) ? fs.readFileSync(templateUrl, 'utf8') : undefined,
            Parameters: config.parameters ? Object.entries(config.parameters).map(([key, value]) => ({
                ParameterKey: key,
                ParameterValue: value
            })) : undefined,
            Tags: config.tags ? Object.entries(config.tags).map(([key, value]) => ({
                Key: key,
                Value: value
            })) : undefined,
            Capabilities: config.capabilities
        });
        try {
            const response = await cfClient.send(updateCommand);
            auditTrail.push(`Stack update initiated: ${response.StackId}`);
            return {
                success: true,
                stackId: response.StackId,
                duration: 0,
                method: 'role-assumption',
                auditTrail
            };
        }
        catch (error) {
            if (error.message?.includes('No updates are to be performed')) {
                auditTrail.push('No updates required');
                return {
                    success: true,
                    stackStatus: 'UPDATE_COMPLETE',
                    duration: 0,
                    method: 'role-assumption',
                    auditTrail
                };
            }
            throw error;
        }
    }
    async deleteStack(stackName, region, auditTrail = []) {
        const cfClient = await this.clientFactory.getCloudFormationClient({ region });
        const deleteCommand = new DeleteStackCommand({ StackName: stackName });
        await cfClient.send(deleteCommand);
        auditTrail.push(`Stack deletion initiated: ${stackName}`);
        return {
            success: true,
            duration: 0,
            method: 'role-assumption',
            auditTrail
        };
    }
    async cancelStackUpdate(stackName, region, auditTrail = []) {
        // CloudFormation doesn't have a direct cancel update command
        // This would require custom implementation based on stack state
        auditTrail.push(`Stack update cancellation not directly supported: ${stackName}`);
        return {
            success: false,
            error: 'Stack update cancellation requires manual intervention',
            duration: 0,
            method: 'direct',
            auditTrail
        };
    }
    async waitForStackCompletion(stackId, region) {
        const cfClient = await this.clientFactory.getCloudFormationClient({ region });
        const maxAttempts = 60; // 30 minutes with 30-second intervals
        let attempts = 0;
        while (attempts < maxAttempts) {
            const command = new DescribeStacksCommand({ StackName: stackId });
            const response = await cfClient.send(command);
            if (!response.Stacks || response.Stacks.length === 0) {
                throw new Error('Stack not found during status check');
            }
            const stack = response.Stacks[0];
            const status = stack.StackStatus;
            // Check if stack operation is complete
            if (status.endsWith('_COMPLETE') || status.endsWith('_FAILED')) {
                const outputs = {};
                if (stack.Outputs) {
                    for (const output of stack.Outputs) {
                        if (output.OutputKey && output.OutputValue) {
                            outputs[output.OutputKey] = output.OutputValue;
                        }
                    }
                }
                return { status, outputs };
            }
            // Wait before next check
            await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds
            attempts++;
        }
        throw new Error('Stack operation timeout');
    }
    handleDeploymentFailure(config, error, startTime, auditTrail, method) {
        auditTrail.push(`Deployment failed: ${error}`);
        return {
            success: false,
            error,
            duration: Date.now() - startTime,
            method: method,
            auditTrail
        };
    }
    isLocalFile(path) {
        return !path.startsWith('http://') && !path.startsWith('https://');
    }
    extractRequiredParameters(templatePath) {
        // This would parse the CloudFormation template and extract required parameters
        // For now, return empty array
        return [];
    }
}
//# sourceMappingURL=DeploymentManager.js.map