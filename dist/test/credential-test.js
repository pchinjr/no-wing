#!/usr/bin/env ts-node
import { CredentialManager } from '../credentials/CredentialManager';
import { AWSClientFactory } from '../credentials/AWSClientFactory';
import { ConfigManager } from '../config/ConfigManager';
async function testCredentialSeparation() {
    console.log('🧪 Testing Q Credential Separation Feature\n');
    try {
        // Test 1: Configuration Management
        console.log('📋 Test 1: Configuration Management');
        const configManager = new ConfigManager('./.no-wing/config.json');
        try {
            const config = await configManager.loadConfig();
            console.log(`✅ Config loaded for developer: ${config.developerId}`);
        }
        catch (error) {
            console.log(`⚠️ Config not found, this is expected for new setups: ${error.message}`);
        }
        // Test 2: Credential Manager Initialization
        console.log('\n🔐 Test 2: Credential Manager');
        const credentialManager = new CredentialManager();
        try {
            await credentialManager.initialize();
            const status = await credentialManager.getCredentialStatus();
            console.log(`✅ Credential manager initialized`);
            console.log(`   Current context: ${status.context?.type}`);
            console.log(`   Identity: ${status.context?.identity?.arn}`);
            console.log(`   Valid: ${status.isValid}`);
        }
        catch (error) {
            console.log(`❌ Credential manager failed: ${error.message}`);
            console.log('   This is expected if AWS credentials are not configured');
        }
        // Test 3: AWS Client Factory
        console.log('\n🏭 Test 3: AWS Client Factory');
        const clientFactory = new AWSClientFactory(credentialManager);
        try {
            const stsClient = await clientFactory.getSTSClient();
            console.log('✅ STS client created successfully');
            const cacheStats = clientFactory.getCacheStats();
            console.log(`   Cache size: ${cacheStats.size}`);
            console.log(`   Cached clients: ${cacheStats.keys.join(', ')}`);
        }
        catch (error) {
            console.log(`❌ Client factory failed: ${error.message}`);
        }
        // Test 4: Context Switching (if credentials are available)
        console.log('\n🔄 Test 4: Context Switching');
        try {
            const userContext = await credentialManager.switchToUserContext();
            console.log(`✅ Switched to user context: ${userContext.identity?.arn}`);
            // Try to switch to no-wing context (will fail if not configured)
            try {
                const noWingContext = await credentialManager.switchToNoWingContext();
                console.log(`✅ Switched to no-wing context: ${noWingContext.identity?.arn}`);
            }
            catch (error) {
                console.log(`⚠️ No-wing context not available: ${error.message}`);
                console.log('   This is expected if no-wing credentials are not configured');
            }
        }
        catch (error) {
            console.log(`❌ Context switching failed: ${error.message}`);
        }
        // Test 5: Configuration Validation
        console.log('\n✅ Test 5: Configuration Validation');
        try {
            const validationResult = await configManager.validateIAMSetup();
            console.log(`   Valid: ${validationResult.isValid}`);
            console.log(`   Errors: ${validationResult.errors.length}`);
            console.log(`   Warnings: ${validationResult.warnings.length}`);
            console.log(`   Recommendations: ${validationResult.recommendations.length}`);
            if (validationResult.errors.length > 0) {
                console.log('   Errors:', validationResult.errors);
            }
            if (validationResult.warnings.length > 0) {
                console.log('   Warnings:', validationResult.warnings);
            }
        }
        catch (error) {
            console.log(`⚠️ Validation skipped: ${error.message}`);
        }
        console.log('\n🎉 Credential separation test completed!');
        console.log('\n📝 Next Steps:');
        console.log('   1. Configure no-wing credentials in .no-wing/config.json');
        console.log('   2. Set up appropriate IAM policies');
        console.log('   3. Test deployment operations');
        console.log('   4. Verify audit trail separation');
    }
    catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}
// Run the test if this file is executed directly
if (require.main === module) {
    testCredentialSeparation().catch(console.error);
}
export { testCredentialSeparation };
//# sourceMappingURL=credential-test.js.map