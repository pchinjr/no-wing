#!/usr/bin/env node

import process from "node:process";
import { Command } from 'commander';
import { CredentialManager } from '../credentials/CredentialManager';
import { AWSClientFactory } from '../credentials/AWSClientFactory';
import { ConfigManager } from '../config/ConfigManager';
import { RoleManager } from '../permissions/RoleManager';
import { PermissionElevator } from '../permissions/PermissionElevator';
import { AuditLogger } from '../audit/AuditLogger';
import { DeploymentManager } from '../deployment/DeploymentManager';
import * as fs from 'fs';
import * as path from 'path';

export class NoWingCLI {
  private program: Command;
  private credentialManager: CredentialManager;
  private clientFactory: AWSClientFactory;
  private configManager: ConfigManager;
  private roleManager: RoleManager;
  private permissionElevator: PermissionElevator;
  private auditLogger: AuditLogger;
  private deploymentManager: DeploymentManager;

  constructor() {
    this.program = new Command();
    this.setupCommands();
  }

  async initialize(): Promise<void> {
    // Initialize core components
    this.configManager = new ConfigManager();
    this.credentialManager = new CredentialManager();
    this.clientFactory = new AWSClientFactory(this.credentialManager);
    this.roleManager = new RoleManager(this.credentialManager);
    this.permissionElevator = new PermissionElevator(
      this.credentialManager,
      this.roleManager,
      this.configManager
    );
    this.auditLogger = new AuditLogger(this.credentialManager);
    this.deploymentManager = new DeploymentManager(
      this.credentialManager,
      this.clientFactory,
      this.permissionElevator,
      this.auditLogger,
      this.roleManager
    );

    try {
      await this.configManager.loadConfig();
      await this.credentialManager.initialize();
      console.log('✅ No-wing CLI initialized successfully');
    } catch (error) {
      console.warn('⚠️ Initialization warning:', error.message);
      console.log('💡 Run "no-wing setup" to configure credentials');
    }
  }

  private setupCommands(): void {
    this.program
      .name('no-wing')
      .description('Q Service Account Manager - Secure, auditable project automation')
      .version('1.0.0');

    // Setup command
    this.program
      .command('setup')
      .description('Setup no-wing credentials and configuration')
      .option('-p, --profile <profile>', 'AWS profile to use')
      .option('-r, --region <region>', 'AWS region', 'us-east-1')
      .option('--role-arn <arn>', 'IAM role ARN to assume')
      .action(this.handleSetup.bind(this));

    // Status command
    this.program
      .command('status')
      .description('Show current credential and configuration status')
      .option('--verbose', 'Show detailed information')
      .action(this.handleStatus.bind(this));

    // Deploy command
    this.program
      .command('deploy')
      .description('Deploy CloudFormation stack with Q credentials')
      .argument('<template>', 'CloudFormation template file or URL')
      .option('-s, --stack-name <name>', 'Stack name')
      .option('-p, --parameters <file>', 'Parameters file (JSON)')
      .option('-t, --tags <tags>', 'Tags (key=value,key=value)')
      .option('-r, --region <region>', 'AWS region')
      .option('--s3-bucket <bucket>', 'S3 bucket for template upload')
      .option('--capabilities <caps>', 'Required capabilities (comma-separated)')
      .option('--dry-run', 'Validate deployment without executing')
      .action(this.handleDeploy.bind(this));

    // Rollback command
    this.program
      .command('rollback')
      .description('Rollback a CloudFormation stack')
      .argument('<stack-name>', 'Stack name to rollback')
      .option('-r, --region <region>', 'AWS region')
      .action(this.handleRollback.bind(this));

    // Credentials command group
    const credentialsCmd = this.program
      .command('credentials')
      .description('Manage credentials and contexts');

    credentialsCmd
      .command('switch')
      .description('Switch credential context')
      .argument('<context>', 'Context to switch to (user|no-wing)')
      .action(this.handleCredentialSwitch.bind(this));

    credentialsCmd
      .command('test')
      .description('Test current credentials')
      .action(this.handleCredentialTest.bind(this));

    credentialsCmd
      .command('whoami')
      .description('Show current identity')
      .action(this.handleWhoAmI.bind(this));

    // Permissions command group
    const permissionsCmd = this.program
      .command('permissions')
      .description('Manage permissions and roles');

    permissionsCmd
      .command('list-roles')
      .description('List available roles')
      .option('--pattern <pattern>', 'Filter roles by pattern')
      .action(this.handleListRoles.bind(this));

    permissionsCmd
      .command('test-role')
      .description('Test role assumption')
      .argument('<role-arn>', 'Role ARN to test')
      .action(this.handleTestRole.bind(this));

    permissionsCmd
      .command('requests')
      .description('Show permission requests')
      .option('--status <status>', 'Filter by status')
      .action(this.handlePermissionRequests.bind(this));

    // Audit command group
    const auditCmd = this.program
      .command('audit')
      .description('Audit and compliance commands');

    auditCmd
      .command('events')
      .description('Query audit events')
      .option('--start <date>', 'Start date (ISO format)')
      .option('--end <date>', 'End date (ISO format)')
      .option('--type <types>', 'Event types (comma-separated)')
      .option('--limit <number>', 'Maximum number of events', '100')
      .action(this.handleAuditEvents.bind(this));

    auditCmd
      .command('report')
      .description('Generate compliance report')
      .option('--start <date>', 'Start date (ISO format)')
      .option('--end <date>', 'End date (ISO format)')
      .option('--format <format>', 'Output format (json|table)', 'table')
      .action(this.handleAuditReport.bind(this));

    auditCmd
      .command('verify-cloudtrail')
      .description('Verify CloudTrail integration')
      .action(this.handleVerifyCloudTrail.bind(this));

    // Config command group
    const configCmd = this.program
      .command('config')
      .description('Configuration management');

    configCmd
      .command('show')
      .description('Show current configuration')
      .action(this.handleConfigShow.bind(this));

    configCmd
      .command('validate')
      .description('Validate IAM setup')
      .action(this.handleConfigValidate.bind(this));

    configCmd
      .command('migrate')
      .description('Migrate configuration to latest format')
      .action(this.handleConfigMigrate.bind(this));
  }

  async run(argv: string[]): Promise<void> {
    await this.initialize();
    await this.program.parseAsync(argv);
  }

  // Command handlers
  private async handleSetup(options: Record<string, unknown>): Promise<void> {
    console.log('🔧 Setting up no-wing credentials...');

    try {
      const _config = this.configManager.getConfig() || 
        ConfigManager.createDefaultConfig('dev-' + Date.now(), options.region);

      // Update credentials configuration
      const credentials: Record<string, unknown> = {
        region: options.region
      };

      if (options.profile) {
        credentials.profile = options.profile;
      }

      if (options.roleArn) {
        credentials.roleArn = options.roleArn;
      }

      await this.configManager.updateCredentials(credentials);
      
      // Test the credentials
      await this.credentialManager.initialize();
      const status = await this.credentialManager.getCredentialStatus();
      
      if (status.isValid) {
        console.log('✅ Setup completed successfully');
        console.log(`   Identity: ${status.context?.identity?.arn}`);
      } else {
        console.log('❌ Setup failed - credentials are not valid');
      }

    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      process.exit(1);
    }
  }

  private async handleStatus(options: Record<string, unknown>): Promise<void> {
    console.log('📊 No-wing Status\n');

    try {
      // Credential status
      const credStatus = await this.credentialManager.getCredentialStatus();
      console.log('🔐 Credentials:');
      console.log(`   Context: ${credStatus.context?.type || 'unknown'}`);
      console.log(`   Identity: ${credStatus.context?.identity?.arn || 'unknown'}`);
      console.log(`   Valid: ${credStatus.isValid ? '✅' : '❌'}`);
      
      if (credStatus.expiresAt) {
        console.log(`   Expires: ${credStatus.expiresAt.toISOString()}`);
      }

      // Role status
      const activeSessions = this.roleManager.getActiveSessions();
      console.log(`\n🎭 Active Role Sessions: ${activeSessions.length}`);
      for (const session of activeSessions) {
        console.log(`   ${session.roleArn} (expires: ${session.expiration.toISOString()})`);
      }

      // Permission request status
      const permStats = this.permissionElevator.getRequestStatistics();
      console.log(`\n🔐 Permission Requests:`);
      console.log(`   Total: ${permStats.total}, Pending: ${permStats.pending}`);
      console.log(`   Approved: ${permStats.approved}, Denied: ${permStats.denied}`);

      if (options.verbose) {
        // Configuration status
        const config = this.configManager.getConfig();
        console.log(`\n⚙️ Configuration:`);
        console.log(`   Developer ID: ${config?.developerId || 'not set'}`);
        console.log(`   Q ID: ${config?.qId || 'not set'}`);
        console.log(`   Region: ${config?.region || 'not set'}`);
        console.log(`   Setup Date: ${config?.setupDate || 'not set'}`);
      }

    } catch (error) {
      console.error('❌ Status check failed:', error.message);
    }
  }

  private async handleDeploy(template: string, options: Record<string, unknown>): Promise<void> {
    console.log(`🚀 Deploying CloudFormation stack...`);

    try {
      // Parse options
      const config = {
        stackName: options.stackName || path.basename(template, path.extname(template)),
        templatePath: template,
        region: options.region,
        s3Bucket: options.s3Bucket,
        parameters: options.parameters ? JSON.parse(fs.readFileSync(options.parameters, 'utf8')) : undefined,
        tags: options.tags ? this.parseTags(options.tags) : undefined,
        capabilities: options.capabilities ? options.capabilities.split(',') : undefined
      };

      // Validate deployment first
      if (options.dryRun) {
        const validation = await this.deploymentManager.validateDeployment(config);
        console.log(`\n🔍 Validation Results:`);
        console.log(`   Valid: ${validation.isValid ? '✅' : '❌'}`);
        
        if (validation.errors.length > 0) {
          console.log(`   Errors: ${validation.errors.join(', ')}`);
        }
        
        if (validation.warnings.length > 0) {
          console.log(`   Warnings: ${validation.warnings.join(', ')}`);
        }
        
        if (validation.recommendations.length > 0) {
          console.log(`   Recommendations: ${validation.recommendations.join(', ')}`);
        }
        
        return;
      }

      // Execute deployment
      const result = await this.deploymentManager.deployStack(config);
      
      console.log(`\n📋 Deployment Result:`);
      console.log(`   Success: ${result.success ? '✅' : '❌'}`);
      console.log(`   Method: ${result.method}`);
      console.log(`   Duration: ${Math.round(result.duration / 1000)}s`);
      
      if (result.stackId) {
        console.log(`   Stack ID: ${result.stackId}`);
      }
      
      if (result.stackStatus) {
        console.log(`   Status: ${result.stackStatus}`);
      }
      
      if (result.outputs && Object.keys(result.outputs).length > 0) {
        console.log(`   Outputs:`);
        for (const [key, value] of Object.entries(result.outputs)) {
          console.log(`     ${key}: ${value}`);
        }
      }
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }

      if (result.auditTrail.length > 0) {
        console.log(`\n📝 Audit Trail:`);
        for (const entry of result.auditTrail) {
          console.log(`   • ${entry}`);
        }
      }

    } catch (error) {
      console.error('❌ Deployment failed:', error.message);
      process.exit(1);
    }
  }

  private async handleRollback(stackName: string, options: Record<string, unknown>): Promise<void> {
    console.log(`🔄 Rolling back stack: ${stackName}`);

    try {
      const result = await this.deploymentManager.rollbackDeployment(stackName, options.region);
      
      console.log(`\n📋 Rollback Result:`);
      console.log(`   Success: ${result.success ? '✅' : '❌'}`);
      console.log(`   Duration: ${Math.round(result.duration / 1000)}s`);
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }

      if (result.auditTrail.length > 0) {
        console.log(`\n📝 Audit Trail:`);
        for (const entry of result.auditTrail) {
          console.log(`   • ${entry}`);
        }
      }

    } catch (error) {
      console.error('❌ Rollback failed:', error.message);
      process.exit(1);
    }
  }

  private async handleCredentialSwitch(context: string): Promise<void> {
    console.log(`🔄 Switching to ${context} context...`);

    try {
      if (context === 'user') {
        await this.credentialManager.switchToUserContext();
      } else if (context === 'no-wing') {
        await this.credentialManager.switchToNoWingContext();
      } else {
        throw new Error(`Invalid context: ${context}. Use 'user' or 'no-wing'`);
      }

      const status = await this.credentialManager.getCredentialStatus();
      console.log(`✅ Switched to ${context} context`);
      console.log(`   Identity: ${status.context?.identity?.arn}`);

    } catch (error) {
      console.error('❌ Context switch failed:', error.message);
    }
  }

  private async handleCredentialTest(): Promise<void> {
    console.log('🧪 Testing current credentials...');

    try {
      const status = await this.credentialManager.getCredentialStatus();
      console.log(`✅ Credentials are ${status.isValid ? 'valid' : 'invalid'}`);
      console.log(`   Context: ${status.context?.type}`);
      console.log(`   Identity: ${status.context?.identity?.arn}`);

    } catch (error) {
      console.error('❌ Credential test failed:', error.message);
    }
  }

  private async handleWhoAmI(): Promise<void> {
    try {
      const status = await this.credentialManager.getCredentialStatus();
      console.log(`Current Identity: ${status.context?.identity?.arn || 'unknown'}`);
      console.log(`Context: ${status.context?.type || 'unknown'}`);
      console.log(`User ID: ${status.context?.identity?.userId || 'unknown'}`);
      console.log(`Account: ${status.context?.identity?.account || 'unknown'}`);

    } catch (error) {
      console.error('❌ Identity check failed:', error.message);
    }
  }

  private async handleListRoles(options: Record<string, unknown>): Promise<void> {
    console.log('🎭 Available Roles:');

    try {
      const roles = await this.roleManager.listAvailableRoles();
      
      let filteredRoles = roles;
      if (options.pattern) {
        filteredRoles = roles.filter(role => 
          role.roleName.toLowerCase().includes(options.pattern.toLowerCase())
        );
      }

      if (filteredRoles.length === 0) {
        console.log('   No roles found');
        return;
      }

      for (const role of filteredRoles) {
        console.log(`   • ${role.roleName}`);
        console.log(`     ARN: ${role.roleArn}`);
        if (role.description) {
          console.log(`     Description: ${role.description}`);
        }
        console.log(`     Max Session Duration: ${role.maxSessionDuration}s`);
        console.log('');
      }

    } catch (error) {
      console.error('❌ Failed to list roles:', error.message);
    }
  }

  private async handleTestRole(roleArn: string): Promise<void> {
    console.log(`🧪 Testing role assumption: ${roleArn}`);

    try {
      const canAssume = await this.roleManager.testRoleAssumption(roleArn);
      console.log(`Result: ${canAssume ? '✅ Success' : '❌ Failed'}`);

    } catch (error) {
      console.error('❌ Role test failed:', error.message);
    }
  }

  private handlePermissionRequests(_options: Record<string, unknown>): Promise<void> {
    console.log('🔐 Permission Requests:');

    try {
      const stats = this.permissionElevator.getRequestStatistics();
      console.log(`   Total: ${stats.total}`);
      console.log(`   Pending: ${stats.pending}`);
      console.log(`   Approved: ${stats.approved}`);
      console.log(`   Denied: ${stats.denied}`);
      console.log(`   Expired: ${stats.expired}`);

    } catch (error) {
      console.error('❌ Failed to get permission requests:', error.message);
    }
  }

  private async handleAuditEvents(options: Record<string, unknown>): Promise<void> {
    console.log('📝 Audit Events:');

    try {
      const query: Record<string, unknown> = {
        limit: parseInt(options.limit)
      };

      if (options.start) {
        query.startTime = new Date(options.start);
      }

      if (options.end) {
        query.endTime = new Date(options.end);
      }

      if (options.type) {
        query.eventTypes = options.type.split(',');
      }

      const events = await this.auditLogger.queryEvents(query);
      
      if (events.length === 0) {
        console.log('   No events found');
        return;
      }

      for (const event of events) {
        console.log(`   • ${event.timestamp.toISOString()} - ${event.eventType}`);
        console.log(`     Actor: ${event.actor.type} (${event.actor.identity})`);
        console.log(`     Operation: ${event.operation.service}:${event.operation.action}`);
        console.log(`     Result: ${event.result.success ? '✅' : '❌'}`);
        if (event.result.errorMessage) {
          console.log(`     Error: ${event.result.errorMessage}`);
        }
        console.log('');
      }

    } catch (error) {
      console.error('❌ Failed to query audit events:', error.message);
    }
  }

  private async handleAuditReport(options: Record<string, unknown>): Promise<void> {
    console.log('📊 Generating compliance report...');

    try {
      const startTime = options.start ? new Date(options.start) : new Date(Date.now() - 24 * 60 * 60 * 1000);
      const endTime = options.end ? new Date(options.end) : new Date();

      const report = await this.auditLogger.generateComplianceReport(startTime, endTime);

      if (options.format === 'json') {
        console.log(JSON.stringify(report, null, 2));
      } else {
        console.log(`\n📋 Compliance Report (${report.reportId})`);
        console.log(`   Period: ${report.period.startTime.toISOString()} to ${report.period.endTime.toISOString()}`);
        console.log(`   Generated: ${report.generatedAt.toISOString()}`);
        console.log(`\n📊 Summary:`);
        console.log(`   Total Events: ${report.summary.totalEvents}`);
        console.log(`   User Actions: ${report.summary.userActions}`);
        console.log(`   No-wing Actions: ${report.summary.noWingActions}`);
        console.log(`   Errors: ${report.summary.errors}`);
        console.log(`   Permission Requests: ${report.summary.permissionRequests}`);
        
        if (report.violations.length > 0) {
          console.log(`\n⚠️ Violations (${report.violations.length}):`);
          for (const violation of report.violations) {
            console.log(`   • ${violation.type} (${violation.severity})`);
            console.log(`     ${violation.description}`);
            console.log(`     Recommendation: ${violation.recommendation}`);
          }
        }
      }

    } catch (error) {
      console.error('❌ Failed to generate report:', error.message);
    }
  }

  private async handleVerifyCloudTrail(): Promise<void> {
    console.log('🔍 Verifying CloudTrail integration...');

    try {
      const status = await this.auditLogger.verifyCloudTrailIntegration();
      
      console.log(`   Configured: ${status.isConfigured ? '✅' : '❌'}`);
      console.log(`   Recent Events: ${status.recentEvents}`);
      
      if (status.lastEventTime) {
        console.log(`   Last Event: ${status.lastEventTime.toISOString()}`);
      }
      
      if (status.errors.length > 0) {
        console.log(`   Errors: ${status.errors.join(', ')}`);
      }

    } catch (error) {
      console.error('❌ CloudTrail verification failed:', error.message);
    }
  }

  private handleConfigShow(): Promise<void> {
    try {
      const config = this.configManager.getConfig();
      
      if (!config) {
        console.log('❌ No configuration found. Run "no-wing setup" first.');
        return;
      }

      console.log('⚙️ Current Configuration:');
      console.log(JSON.stringify(config, null, 2));

    } catch (error) {
      console.error('❌ Failed to show configuration:', error.message);
    }
  }

  private async handleConfigValidate(): Promise<void> {
    console.log('🔍 Validating IAM setup...');

    try {
      const result = await this.configManager.validateIAMSetup();
      
      console.log(`   Valid: ${result.isValid ? '✅' : '❌'}`);
      
      if (result.errors.length > 0) {
        console.log(`   Errors: ${result.errors.join(', ')}`);
      }
      
      if (result.warnings.length > 0) {
        console.log(`   Warnings: ${result.warnings.join(', ')}`);
      }
      
      if (result.recommendations.length > 0) {
        console.log(`   Recommendations: ${result.recommendations.join(', ')}`);
      }

    } catch (error) {
      console.error('❌ Validation failed:', error.message);
    }
  }

  private async handleConfigMigrate(): Promise<void> {
    console.log('🔄 Migrating configuration...');

    try {
      await this.configManager.migrateConfig();
      console.log('✅ Configuration migrated successfully');

    } catch (error) {
      console.error('❌ Migration failed:', error.message);
    }
  }

  // Helper methods
  private parseTags(tagString: string): Record<string, string> {
    const tags: Record<string, string> = {};
    const pairs = tagString.split(',');
    
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key && value) {
        tags[key.trim()] = value.trim();
      }
    }
    
    return tags;
  }
}

// CLI entry point
if (require.main === module) {
  const cli = new NoWingCLI();
  cli.run(process.argv).catch(error => {
    console.error('❌ CLI error:', error.message);
    process.exit(1);
  });
}

export { NoWingCLI };
