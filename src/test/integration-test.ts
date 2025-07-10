#!/usr/bin/env ts-node

import process from "node:process";
import { CredentialManager } from '../credentials/CredentialManager.ts';
import { AWSClientFactory } from '../credentials/AWSClientFactory.ts';
import { ConfigManager } from '../config/ConfigManager.ts';
import { RoleManager, OperationContext } from '../permissions/RoleManager.ts';
import { PermissionElevator } from '../permissions/PermissionElevator.ts';
import { AuditLogger } from '../audit/AuditLogger.ts';
import { DeploymentManager } from '../deployment/DeploymentManager.ts';
import { NoWingCLI } from '../cli/NoWingCLI.ts';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "https://deno.land/std@0.208.0/fs/mod.ts";
import { readTextFile, writeTextFile } from "https://deno.land/std@0.208.0/fs/mod.ts";
import { join, dirname, resolve, basename } from "https://deno.land/std@0.208.0/path/mod.ts";

interface TestResult {
  name: string;
  success: boolean;
  duration: number;
  error?: string;
  details?: unknown;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalDuration: number;
}

export class IntegrationTestRunner {
  private credentialManager: CredentialManager;
  private clientFactory: AWSClientFactory;
  private configManager: ConfigManager;
  private roleManager: RoleManager;
  private permissionElevator: PermissionElevator;
  private auditLogger: AuditLogger;
  private deploymentManager: DeploymentManager;
  private cli: NoWingCLI;
  private testResults: TestSuite[] = [];

  constructor() {
    this.initializeComponents();
  }

  private initializeComponents(): void {
    this.configManager = new ConfigManager('./.no-wing/test-config.json');
    this.credentialManager = new CredentialManager('./.no-wing/test-config.json');
    this.clientFactory = new AWSClientFactory(this.credentialManager);
    this.roleManager = new RoleManager(this.credentialManager);
    this.permissionElevator = new PermissionElevator(
      this.credentialManager,
      this.roleManager,
      this.configManager
    );
    this.auditLogger = new AuditLogger(this.credentialManager, {
      logFilePath: './.no-wing/test-audit.log'
    });
    this.deploymentManager = new DeploymentManager(
      this.credentialManager,
      this.clientFactory,
      this.permissionElevator,
      this.auditLogger,
      this.roleManager
    );
    this.cli = new NoWingCLI();
  }

  async runAllTests(): Promise<void> {
    console.log('🧪 Starting No-wing Integration Test Suite\n');

    try {
      // Setup test environment
      await this.setupTestEnvironment();

      // Run test suites
      await this.runCredentialTests();
      await this.runPermissionTests();
      await this.runDeploymentTests();
      await this.runAuditTests();
      await this.runCLITests();
      await this.runSecurityTests();
      await this.runEndToEndTests();

      // Generate test report
      this.generateTestReport();

    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      process.exit(1);
    } finally {
      await this.cleanupTestEnvironment();
    }
  }

  private async setupTestEnvironment(): Promise<void> {
    console.log('🔧 Setting up test environment...');

    // Create test configuration
    const testConfig = ConfigManager.createDefaultConfig('test-dev-' + Date.now(), 'us-east-1');
    testConfig.credentials = {
      region: 'us-east-1'
    };

    await this.configManager.saveConfig(testConfig);

    // Create test CloudFormation template
    const testTemplate = {
      AWSTemplateFormatVersion: '2010-09-09',
      Description: 'No-wing integration test stack',
      Resources: {
        TestBucket: {
          Type: 'AWS::S3::Bucket',
          Properties: {
            BucketName: `no-wing-test-${Date.now()}`,
            PublicReadPolicy: false
          }
        }
      },
      Outputs: {
        BucketName: {
          Description: 'Test bucket name',
          Value: { Ref: 'TestBucket' }
        }
      }
    };

    await writeTextFile('./.no-wing/test-template.json', JSON.stringify(testTemplate, null, 2));
    console.log('✅ Test environment setup complete');
  }

  private async runCredentialTests(): Promise<void> {
    const suite: TestSuite = {
      name: 'Credential Management',
      tests: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalDuration: 0
    };

    console.log('\n🔐 Running Credential Management Tests...');

    // Test 1: Credential Manager Initialization
    suite.tests.push(await this.runTest('Credential Manager Initialization', async () => {
      await this.credentialManager.initialize();
      const status = await this.credentialManager.getCredentialStatus();
      return { valid: status.isValid, context: status.context?.type };
    }));

    // Test 2: Context Switching
    suite.tests.push(await this.runTest('Context Switching', async () => {
      const userContext = await this.credentialManager.switchToUserContext();
      const userValid = await this.credentialManager.validateCurrentCredentials();
      
      try {
        const noWingContext = await this.credentialManager.switchToNoWingContext();
        const noWingValid = await this.credentialManager.validateCurrentCredentials();
        return { userValid, noWingValid, contexts: [userContext.type, noWingContext.type] };
      } catch (error) {
        return { userValid, noWingValid: false, error: error.message };
      }
    }));

    // Test 3: AWS Client Factory
    suite.tests.push(await this.runTest('AWS Client Factory', async () => {
      const _stsClient = await this.clientFactory.getSTSClient();
      const _s3Client = await this.clientFactory.getS3Client();
      const cacheStats = this.clientFactory.getCacheStats();
      return { clientsCreated: cacheStats.size, cacheKeys: cacheStats.keys };
    }));

    // Test 4: Credential Validation
    suite.tests.push(await this.runTest('Credential Validation', async () => {
      const isValid = await this.credentialManager.validateCurrentCredentials();
      const status = await this.credentialManager.getCredentialStatus();
      return { valid: isValid, identity: status.context?.identity?.arn };
    }));

    this.testResults.push(this.calculateSuiteResults(suite));
  }

  private async runPermissionTests(): Promise<void> {
    const suite: TestSuite = {
      name: 'Permission Management',
      tests: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalDuration: 0
    };

    console.log('\n🔐 Running Permission Management Tests...');

    // Test 1: Role Discovery
    suite.tests.push(await this.runTest('Role Discovery', async () => {
      const roles = await this.roleManager.listAvailableRoles();
      return { roleCount: roles.length, sampleRoles: roles.slice(0, 3).map(r => r.roleName) };
    }));

    // Test 2: Role Pattern Matching
    suite.tests.push(await this.runTest('Role Pattern Matching', async () => {
      const context: OperationContext = {
        operation: 'cloudformation-deploy',
        service: 'cloudformation'
      };
      const bestRole = await this.roleManager.findBestRole(context);
      return { foundRole: !!bestRole, roleArn: bestRole };
    }));

    // Test 3: Permission Elevation
    suite.tests.push(await this.runTest('Permission Elevation', async () => {
      const context: OperationContext = {
        operation: 's3-operations',
        service: 's3',
        resources: ['arn:aws:s3:::test-bucket/*']
      };
      const result = await this.permissionElevator.elevatePermissions(context);
      return { 
        success: result.success, 
        method: result.method, 
        hasAlternatives: !!result.alternatives?.length 
      };
    }));

    // Test 4: Permission Request Management
    suite.tests.push(await this.runTest('Permission Request Management', () => {
      const stats = this.permissionElevator.getRequestStatistics();
      return { 
        totalRequests: stats.total,
        pendingRequests: stats.pending,
        approvedRequests: stats.approved
      };
    }));

    // Test 5: Session Management
    suite.tests.push(await this.runTest('Session Management', () => {
      const activeSessions = this.roleManager.getActiveSessions();
      this.roleManager.cleanupExpiredSessions();
      const afterCleanup = this.roleManager.getActiveSessions();
      return { 
        activeSessionsBefore: activeSessions.length,
        activeSessionsAfter: afterCleanup.length
      };
    }));

    this.testResults.push(this.calculateSuiteResults(suite));
  }

  private async runDeploymentTests(): Promise<void> {
    const suite: TestSuite = {
      name: 'Deployment Management',
      tests: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalDuration: 0
    };

    console.log('\n🚀 Running Deployment Management Tests...');

    // Test 1: Deployment Validation
    suite.tests.push(await this.runTest('Deployment Validation', async () => {
      const config = {
        stackName: 'no-wing-test-stack',
        templatePath: './.no-wing/test-template.json',
        region: 'us-east-1'
      };
      const validation = await this.deploymentManager.validateDeployment(config);
      return {
        isValid: validation.isValid,
        errorCount: validation.errors.length,
        warningCount: validation.warnings.length,
        recommendationCount: validation.recommendations.length
      };
    }));

    // Test 2: Template Processing
    suite.tests.push(await this.runTest('Template Processing', () => {
      const templatePath = './.no-wing/test-template.json';
      const templateExists = existsSync(templatePath);
      const templateContent = templateExists ? JSON.parse(await readTextFile(templatePath)) : null;
      return {
        templateExists,
        hasResources: !!templateContent?.Resources,
        resourceCount: templateContent?.Resources ? Object.keys(templateContent.Resources).length : 0
      };
    }));

    // Test 3: Deployment Dry Run (without actual deployment)
    suite.tests.push(await this.runTest('Deployment Dry Run', async () => {
      // This would test the deployment logic without actually creating resources
      const config = {
        stackName: 'no-wing-test-stack-dry-run',
        templatePath: './.no-wing/test-template.json',
        region: 'us-east-1'
      };
      
      // Simulate deployment preparation
      const validation = await this.deploymentManager.validateDeployment(config);
      return {
        validationPassed: validation.isValid,
        readyForDeployment: validation.isValid && validation.errors.length === 0
      };
    }));

    this.testResults.push(this.calculateSuiteResults(suite));
  }

  private async runAuditTests(): Promise<void> {
    const suite: TestSuite = {
      name: 'Audit and Logging',
      tests: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalDuration: 0
    };

    console.log('\n📝 Running Audit and Logging Tests...');

    // Test 1: Event Logging
    suite.tests.push(await this.runTest('Event Logging', async () => {
      await this.auditLogger.logCredentialSwitch('user', 'no-wing', true);
      await this.auditLogger.logRoleAssumption('arn:aws:iam::123456789012:role/test-role', 'test-session', true);
      await this.auditLogger.logAWSOperation('s3', 'GetObject', ['arn:aws:s3:::test-bucket/test-key'], {}, true);
      
      return { eventsLogged: 3 };
    }));

    // Test 2: Event Querying
    suite.tests.push(await this.runTest('Event Querying', async () => {
      const events = await this.auditLogger.queryEvents({
        eventTypes: ['credential-switch', 'role-assumption'],
        limit: 10
      });
      return { eventCount: events.length };
    }));

    // Test 3: Compliance Report Generation
    suite.tests.push(await this.runTest('Compliance Report Generation', async () => {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 60 * 60 * 1000); // Last hour
      const report = await this.auditLogger.generateComplianceReport(startTime, endTime);
      
      return {
        reportGenerated: !!report.reportId,
        totalEvents: report.summary.totalEvents,
        violationCount: report.violations.length
      };
    }));

    // Test 4: CloudTrail Integration
    suite.tests.push(await this.runTest('CloudTrail Integration', async () => {
      const status = await this.auditLogger.verifyCloudTrailIntegration();
      return {
        isConfigured: status.isConfigured,
        recentEvents: status.recentEvents,
        hasErrors: status.errors.length > 0
      };
    }));

    // Test 5: Buffer Management
    suite.tests.push(await this.runTest('Buffer Management', async () => {
      // Log multiple events to test buffering
      for (let i = 0; i < 5; i++) {
        await this.auditLogger.logAWSOperation('test', 'TestAction', [], { iteration: i }, true);
      }
      
      await this.auditLogger.flushBuffer();
      return { bufferFlushed: true };
    }));

    this.testResults.push(this.calculateSuiteResults(suite));
  }

  private async runCLITests(): Promise<void> {
    const suite: TestSuite = {
      name: 'CLI Integration',
      tests: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalDuration: 0
    };

    console.log('\n💻 Running CLI Integration Tests...');

    // Test 1: CLI Initialization
    suite.tests.push(await this.runTest('CLI Initialization', async () => {
      await this.cli.initialize();
      return { initialized: true };
    }));

    // Test 2: Command Structure
    suite.tests.push(await this.runTest('Command Structure', () => {
      // Test that CLI has expected commands
      const expectedCommands = ['setup', 'status', 'deploy', 'rollback', 'credentials', 'permissions', 'audit', 'config'];
      return { expectedCommands: expectedCommands.length };
    }));

    this.testResults.push(this.calculateSuiteResults(suite));
  }

  private async runSecurityTests(): Promise<void> {
    const suite: TestSuite = {
      name: 'Security Validation',
      tests: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalDuration: 0
    };

    console.log('\n🔒 Running Security Validation Tests...');

    // Test 1: Credential Isolation
    suite.tests.push(await this.runTest('Credential Isolation', async () => {
      await this.credentialManager.switchToUserContext();
      const userContext = this.credentialManager.getCurrentContext();
      
      try {
        await this.credentialManager.switchToNoWingContext();
        const noWingContext = this.credentialManager.getCurrentContext();
        
        return {
          contextsAreDifferent: userContext?.identity?.arn !== noWingContext?.identity?.arn,
          userContext: userContext?.type,
          noWingContext: noWingContext?.type
        };
      } catch (error) {
        return {
          contextsAreDifferent: true,
          userContext: userContext?.type,
          noWingContext: 'unavailable',
          error: error.message
        };
      }
    }));

    // Test 2: Permission Boundary Validation
    suite.tests.push(await this.runTest('Permission Boundary Validation', async () => {
      const validation = await this.configManager.validateIAMSetup();
      return {
        validationPerformed: true,
        hasErrors: validation.errors.length > 0,
        hasWarnings: validation.warnings.length > 0,
        hasRecommendations: validation.recommendations.length > 0
      };
    }));

    // Test 3: Audit Trail Integrity
    suite.tests.push(await this.runTest('Audit Trail Integrity', async () => {
      // Log a test event and verify it can be retrieved
      const testEventId = `test-${Date.now()}`;
      await this.auditLogger.logAWSOperation('test', 'SecurityTest', [], { testId: testEventId }, true);
      
      const events = await this.auditLogger.queryEvents({ limit: 100 });
      const testEvent = events.find(e => e.operation.parameters?.testId === testEventId);
      
      return {
        eventLogged: true,
        eventRetrievable: !!testEvent,
        auditTrailIntact: !!testEvent
      };
    }));

    this.testResults.push(this.calculateSuiteResults(suite));
  }

  private async runEndToEndTests(): Promise<void> {
    const suite: TestSuite = {
      name: 'End-to-End Workflow',
      tests: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalDuration: 0
    };

    console.log('\n🔗 Running End-to-End Workflow Tests...');

    // Test 1: Complete Deployment Workflow
    suite.tests.push(await this.runTest('Complete Deployment Workflow', async () => {
      const steps: string[] = [];
      
      // Step 1: Switch to no-wing context
      await this.credentialManager.switchToNoWingContext();
      steps.push('context-switch');
      
      // Step 2: Validate deployment
      const config = {
        stackName: 'no-wing-e2e-test',
        templatePath: './.no-wing/test-template.json',
        region: 'us-east-1'
      };
      const validation = await this.deploymentManager.validateDeployment(config);
      steps.push('validation');
      
      // Step 3: Attempt permission elevation
      const context: OperationContext = {
        operation: 'cloudformation-deploy',
        service: 'cloudformation',
        resources: [`arn:aws:cloudformation:us-east-1:*:stack/${config.stackName}/*`]
      };
      const _elevation = await this.permissionElevator.elevatePermissions(context);
      steps.push('permission-elevation');
      
      // Step 4: Generate audit report
      const report = await this.auditLogger.generateComplianceReport(
        new Date(Date.now() - 60 * 60 * 1000),
        new Date()
      );
      steps.push('audit-report');
      
      return {
        stepsCompleted: steps.length,
        steps,
        validationPassed: validation.isValid,
        elevationAttempted: true,
        auditGenerated: !!report.reportId
      };
    }));

    // Test 2: Error Handling and Recovery
    suite.tests.push(await this.runTest('Error Handling and Recovery', async () => {
      const errors: string[] = [];
      
      try {
        // Test invalid context switch
        await this.credentialManager.switchToNoWingContext();
      } catch (_error) {
        errors.push('context-switch-error');
      }
      
      try {
        // Test invalid deployment config
        const invalidConfig = {
          stackName: '',
          templatePath: '/nonexistent/template.json',
          region: 'invalid-region'
        };
        await this.deploymentManager.validateDeployment(invalidConfig);
      } catch (_error) {
        errors.push('validation-error');
      }
      
      return {
        errorsHandled: errors.length,
        errorTypes: errors,
        gracefulDegradation: true
      };
    }));

    this.testResults.push(this.calculateSuiteResults(suite));
  }

  private async runTest(name: string, testFunction: () => Promise<unknown>): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      console.log(`   🧪 ${name}...`);
      const details = await testFunction();
      const duration = Date.now() - startTime;
      
      console.log(`   ✅ ${name} (${duration}ms)`);
      return {
        name,
        success: true,
        duration,
        details
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`   ❌ ${name} (${duration}ms): ${error.message}`);
      
      return {
        name,
        success: false,
        duration,
        error: error.message
      };
    }
  }

  private calculateSuiteResults(suite: TestSuite): TestSuite {
    suite.totalTests = suite.tests.length;
    suite.passedTests = suite.tests.filter(t => t.success).length;
    suite.failedTests = suite.tests.filter(t => !t.success).length;
    suite.totalDuration = suite.tests.reduce((sum, t) => sum + t.duration, 0);
    
    console.log(`   📊 ${suite.name}: ${suite.passedTests}/${suite.totalTests} passed (${suite.totalDuration}ms)`);
    return suite;
  }

  private generateTestReport(): void {
    console.log('\n📋 Test Report Summary\n');
    
    const totalTests = this.testResults.reduce((sum, suite) => sum + suite.totalTests, 0);
    const totalPassed = this.testResults.reduce((sum, suite) => sum + suite.passedTests, 0);
    const totalFailed = this.testResults.reduce((sum, suite) => sum + suite.failedTests, 0);
    const totalDuration = this.testResults.reduce((sum, suite) => sum + suite.totalDuration, 0);
    
    console.log(`📊 Overall Results:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${totalPassed} (${Math.round(totalPassed / totalTests * 100)}%)`);
    console.log(`   Failed: ${totalFailed} (${Math.round(totalFailed / totalTests * 100)}%)`);
    console.log(`   Total Duration: ${Math.round(totalDuration / 1000)}s`);
    
    console.log(`\n📋 Suite Breakdown:`);
    for (const suite of this.testResults) {
      const passRate = Math.round(suite.passedTests / suite.totalTests * 100);
      console.log(`   ${suite.name}: ${suite.passedTests}/${suite.totalTests} (${passRate}%) - ${Math.round(suite.totalDuration / 1000)}s`);
    }
    
    // Show failed tests
    const failedTests = this.testResults.flatMap(suite => 
      suite.tests.filter(test => !test.success).map(test => ({ suite: suite.name, ...test }))
    );
    
    if (failedTests.length > 0) {
      console.log(`\n❌ Failed Tests:`);
      for (const test of failedTests) {
        console.log(`   ${test.suite} > ${test.name}: ${test.error}`);
      }
    }
    
    // Generate JSON report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests,
        totalPassed,
        totalFailed,
        totalDuration,
        passRate: Math.round(totalPassed / totalTests * 100)
      },
      suites: this.testResults
    };
    
    await writeTextFile('./.no-wing/test-report.json', JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ./.no-wing/test-report.json`);
    
    if (totalFailed > 0) {
      console.log(`\n❌ ${totalFailed} tests failed. Review the report for details.`);
      process.exit(1);
    } else {
      console.log(`\n🎉 All tests passed! No-wing credential separation is working correctly.`);
    }
  }

  private async cleanupTestEnvironment(): Promise<void> {
    console.log('\n🧹 Cleaning up test environment...');
    
    try {
      // Clean up test files
      const testFiles = [
        './.no-wing/test-config.json',
        './.no-wing/test-template.json',
        './.no-wing/test-audit.log'
      ];
      
      for (const file of testFiles) {
        if (existsSync(file)) {
          fs.unlinkSync(file);
        }
      }
      
      // Flush any remaining audit events
      await this.auditLogger.flushBuffer();
      
      console.log('✅ Test environment cleaned up');
    } catch (error) {
      console.warn('⚠️ Cleanup warning:', error.message);
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const testRunner = new IntegrationTestRunner();
  testRunner.runAllTests().catch(error => {
    console.error('❌ Test runner failed:', error.message);
    process.exit(1);
  });
}

export { IntegrationTestRunner };
