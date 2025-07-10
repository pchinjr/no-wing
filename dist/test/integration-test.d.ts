#!/usr/bin/env ts-node
export declare class IntegrationTestRunner {
    private credentialManager;
    private clientFactory;
    private configManager;
    private roleManager;
    private permissionElevator;
    private auditLogger;
    private deploymentManager;
    private cli;
    private testResults;
    constructor();
    private initializeComponents;
    runAllTests(): Promise<void>;
    private setupTestEnvironment;
    private runCredentialTests;
    private runPermissionTests;
    private runDeploymentTests;
    private runAuditTests;
    private runCLITests;
    private runSecurityTests;
    private runEndToEndTests;
    private runTest;
    private calculateSuiteResults;
    private generateTestReport;
    private cleanupTestEnvironment;
}
export { IntegrationTestRunner };
//# sourceMappingURL=integration-test.d.ts.map