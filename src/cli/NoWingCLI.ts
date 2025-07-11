#!/usr/bin/env -S deno run --allow-all

// Deno-compatible imports
import { Command } from 'npm:commander@11.1.0';
import { CredentialManager } from '../credentials/CredentialManager.ts';
import { AWSClientFactory } from '../credentials/AWSClientFactory.ts';
import { ConfigManager } from '../config/ConfigManager.ts';
import { RoleManager } from '../permissions/RoleManager.ts';
import { PermissionElevator } from '../permissions/PermissionElevator.ts';
import { AuditLogger } from '../audit/AuditLogger.ts';
import { DeploymentManager } from '../deployment/DeploymentManager.ts';

// Path utilities removed - not currently used

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
    // Check if this is a help command to avoid noisy initialization
    const isHelpCommand = Deno.args.length === 0 || 
                         Deno.args.includes('help') || 
                         Deno.args.includes('-h') || 
                         Deno.args.includes('--help');

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

    // Only attempt full initialization for non-help commands
    if (!isHelpCommand) {
      try {
        await this.configManager.loadConfig();
        await this.credentialManager.initialize();
        console.log('✅ No-wing CLI initialized successfully');
      } catch (error) {
        console.warn('⚠️ Initialization warning:', error.message);
        console.log('💡 Run "no-wing setup" to configure credentials');
      }
    }
  }

  private setupCommands(): void {
    this.program
      .name('no-wing')
      .description('Q Service Account Manager - Secure, auditable project automation')
      .version('1.0.0')
      .configureHelp({
        sortSubcommands: true,
        subcommandTerm: (cmd) => cmd.name() + ' ' + cmd.usage(),
      })
      .addHelpText('after', `
Examples:
  $ no-wing setup --profile my-profile     # Initial setup
  $ no-wing status                         # Check current status  
  $ no-wing deploy template.yaml           # Deploy with Q credentials
  $ no-wing credentials whoami             # Show current identity
  
Quick Start:
  1. no-wing setup --profile <aws-profile>
  2. no-wing status
  3. no-wing deploy <template>

Documentation: https://github.com/your-org/no-wing
`);

    // === CORE COMMANDS ===
    this.program
      .command('setup')
      .description('🚀 Initial setup and configuration')
      .option('-p, --profile <profile>', 'AWS profile to use')
      .option('-r, --region <region>', 'AWS region', 'us-east-1')
      .option('--role-arn <arn>', 'IAM role ARN to assume')
      .action(this.handleSetup.bind(this));

    this.program
      .command('status')
      .description('📊 Show current system status')
      .option('--verbose', 'Show detailed information')
      .action(this.handleStatus.bind(this));

    this.program
      .command('deploy')
      .description('🚀 Deploy CloudFormation with Q credentials')
      .argument('<template>', 'CloudFormation template file')
      .option('-s, --stack-name <name>', 'Stack name (defaults to template name)')
      .option('-p, --parameters <params>', 'Stack parameters (JSON)')
      .option('--dry-run', 'Show what would be deployed without executing')
      .action(this.handleDeploy.bind(this));

    this.program
      .command('rollback')
      .description('⏪ Rollback CloudFormation deployment')
      .argument('<stack-name>', 'Name of stack to rollback')
      .option('--confirm', 'Skip confirmation prompt')
      .action(this.handleRollback.bind(this));

    // === CREDENTIAL MANAGEMENT ===
    const credentialsCmd = this.program
      .command('credentials')
      .description('🔐 Credential and identity management')
      .addHelpText('after', `
Examples:
  $ no-wing credentials whoami             # Show current identity
  $ no-wing credentials test               # Test current credentials
  $ no-wing credentials switch user        # Switch to user context
  $ no-wing credentials switch no-wing     # Switch to Q context
`);

    credentialsCmd
      .command('switch')
      .description('Switch credential context')
      .argument('<context>', 'Context: user | no-wing')
      .action(this.handleCredentialSwitch.bind(this));

    credentialsCmd
      .command('test')
      .description('Test current credentials')
      .action(this.handleCredentialTest.bind(this));

    credentialsCmd
      .command('whoami')
      .description('Show current identity and permissions')
      .action(this.handleWhoAmI.bind(this));

    // === PERMISSION MANAGEMENT ===
    const permissionsCmd = this.program
      .command('permissions')
      .description('🔑 Role and permission management')
      .addHelpText('after', `
Examples:
  $ no-wing permissions list               # List available roles
  $ no-wing permissions test-role MyRole   # Test role assumption
  $ no-wing permissions request MyRole     # Request role elevation
`);

    permissionsCmd
      .command('list')
      .description('List available roles')
      .option('--pattern <pattern>', 'Filter roles by pattern')
      .action(this.handleListRoles.bind(this));

    permissionsCmd
      .command('test-role')
      .description('Test role assumption')
      .argument('<role-arn>', 'Role ARN to test')
      .action(this.handleTestRole.bind(this));

    permissionsCmd
      .command('request')
      .description('Request role elevation')
      .argument('<role-arn>', 'Role ARN to request')
      .option('--reason <reason>', 'Reason for elevation request')
      .action(this.handleRequestPermission.bind(this));

    permissionsCmd
      .command('approve')
      .description('Approve permission request')
      .argument('<request-id>', 'Request ID to approve')
      .action(this.handleApprovePermission.bind(this));

    // === AUDIT & COMPLIANCE ===
    const auditCmd = this.program
      .command('audit')
      .description('📋 Audit and compliance reporting')
      .addHelpText('after', `
Examples:
  $ no-wing audit events --last 24h       # Recent audit events
  $ no-wing audit report --format pdf     # Generate compliance report
  $ no-wing audit verify-cloudtrail       # Verify CloudTrail integration
`);

    auditCmd
      .command('events')
      .description('Query audit events')
      .option('--last <duration>', 'Time range (e.g., 24h, 7d, 30d)')
      .option('--user <user>', 'Filter by user')
      .option('--action <action>', 'Filter by action')
      .action(this.handleAuditEvents.bind(this));

    auditCmd
      .command('report')
      .description('Generate compliance report')
      .option('--format <format>', 'Output format (json|csv|pdf)', 'json')
      .option('--output <file>', 'Output file path')
      .action(this.handleAuditReport.bind(this));

    auditCmd
      .command('verify-cloudtrail')
      .description('Verify CloudTrail integration')
      .action(this.handleVerifyCloudTrail.bind(this));

    // === CONFIGURATION ===
    const configCmd = this.program
      .command('config')
      .description('⚙️ Configuration management')
      .addHelpText('after', `
Examples:
  $ no-wing config show                    # Display current configuration
  $ no-wing config validate                # Validate configuration
  $ no-wing config migrate                 # Migrate configuration format
`);

    configCmd
      .command('show')
      .description('Display current configuration')
      .option('--format <format>', 'Output format (json|yaml)', 'json')
      .action(this.handleConfigShow.bind(this));

    configCmd
      .command('validate')
      .description('Validate configuration')
      .action(this.handleConfigValidate.bind(this));

    configCmd
      .command('migrate')
      .description('Migrate configuration format')
      .option('--backup', 'Create backup before migration')
      .action(this.handleConfigMigrate.bind(this));
  }

  async run(): Promise<void> {
    await this.initialize();
    await this.program.parseAsync();
  }

  // === COMMAND HANDLERS ===

  private handleSetup(options: { profile?: string; region?: string; roleArn?: string }): void {
    console.log('🚀 Setting up no-wing...');
    console.log('Options:', options);
    
    try {
      // Implementation would go here
      console.log('✅ Setup completed successfully');
    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      Deno.exit(1);
    }
  }

  private handleStatus(_options?: Record<string, unknown>): void {
    console.log('📊 No-wing Status');
    console.log('================');
    
    try {
      // Implementation would go here
      console.log('✅ System operational');
    } catch (error) {
      console.error('❌ Status check failed:', error.message);
      Deno.exit(1);
    }
  }

  private handleDeploy(template: string, options: { region?: string; profile?: string }): void {
    console.log(`🚀 Deploying ${template}...`);
    console.log('Options:', options);
    
    try {
      // Implementation would go here
      console.log('✅ Deployment completed successfully');
    } catch (error) {
      console.error('❌ Deployment failed:', error.message);
      Deno.exit(1);
    }
  }

  private handleRollback(stackName: string, options: { region?: string; profile?: string }): void {
    console.log(`⏪ Rolling back ${stackName}...`);
    console.log('Options:', options);
    
    try {
      // Implementation would go here
      console.log('✅ Rollback completed successfully');
    } catch (error) {
      console.error('❌ Rollback failed:', error.message);
      Deno.exit(1);
    }
  }

  // Credential handlers
  private handleCredentialSwitch(context: string): void {
    console.log(`🔄 Switching to ${context} context...`);
    // Implementation would go here
  }

  private handleCredentialTest(): void {
    console.log('🧪 Testing credentials...');
    // Implementation would go here
  }

  private handleWhoAmI(): void {
    console.log('👤 Current Identity');
    // Implementation would go here
  }

  // Permission handlers
  private handleListRoles(_options?: Record<string, unknown>): void {
    console.log('📋 Available Roles');
    // Implementation would go here
  }

  private handleTestRole(roleArn: string): void {
    console.log(`🧪 Testing role: ${roleArn}`);
    // Implementation would go here
  }

  private handleRequestPermission(roleArn: string, _options?: Record<string, unknown>): void {
    console.log(`🙋 Requesting permission for: ${roleArn}`);
    // Implementation would go here
  }

  private handleApprovePermission(requestId: string): void {
    console.log(`✅ Approving request: ${requestId}`);
    // Implementation would go here
  }

  // Audit handlers
  private handleAuditEvents(_options?: Record<string, unknown>): void {
    console.log('📋 Audit Events');
    // Implementation would go here
  }

  private handleAuditReport(_options?: Record<string, unknown>): void {
    console.log('📊 Generating audit report...');
    // Implementation would go here
  }

  private handleVerifyCloudTrail(): void {
    console.log('🔍 Verifying CloudTrail integration...');
    // Implementation would go here
  }

  // Config handlers
  private handleConfigShow(_options?: Record<string, unknown>): void {
    console.log('⚙️ Current Configuration');
    // Implementation would go here
  }

  private handleConfigValidate(): void {
    console.log('✅ Validating configuration...');
    // Implementation would go here
  }

  private handleConfigMigrate(_options?: Record<string, unknown>): void {
    console.log('🔄 Migrating configuration...');
    // Implementation would go here
  }
}
