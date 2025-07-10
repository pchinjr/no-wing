# Q Credential Separation Documentation

## Overview

The Q Credential Separation feature provides secure, auditable identity management for Amazon Q operations within the no-wing project. This system ensures clear separation between user actions and Q (AI assistant) actions while maintaining full audit trails for compliance.

## Architecture

### Core Components

1. **CredentialManager**: Manages credential contexts and switching between user and Q identities
2. **AWSClientFactory**: Provides context-aware AWS SDK clients with automatic credential management
3. **RoleManager**: Handles role discovery, assumption, and session management
4. **PermissionElevator**: Implements intelligent permission elevation with graceful degradation
5. **AuditLogger**: Provides comprehensive audit logging and compliance reporting
6. **DeploymentManager**: Manages CloudFormation deployments with credential separation
7. **NoWingCLI**: Command-line interface for all credential separation operations

### Identity Separation Model

```
┌─────────────────┐    ┌─────────────────┐
│   User Actions  │    │   Q Actions     │
│                 │    │                 │
│ • Manual AWS    │    │ • Deployments   │
│   operations    │    │ • Role          │
│ • Configuration │    │   assumptions   │
│ • Validation    │    │ • Automated     │
│                 │    │   operations    │
└─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│ User Credentials│    │ Q Credentials   │
│                 │    │                 │
│ • Personal AWS  │    │ • Service       │
│   profile       │    │   account       │
│ • Limited scope │    │ • Deployment    │
│ • Read access   │    │   permissions   │
└─────────────────┘    └─────────────────┘
         │                       │
         └───────────┬───────────┘
                     ▼
            ┌─────────────────┐
            │   CloudTrail    │
            │                 │
            │ • Separate      │
            │   identities    │
            │ • Clear audit   │
            │   trail         │
            └─────────────────┘
```

## Setup and Configuration

### Initial Setup

1. **Install Dependencies**
   ```bash
   npm install
   npm run build
   ```

2. **Configure Q Credentials**
   ```bash
   no-wing setup --profile no-wing-profile --region us-east-1
   # OR
   no-wing setup --role-arn arn:aws:iam::123456789012:role/no-wing-role
   ```

3. **Validate Setup**
   ```bash
   no-wing status --verbose
   no-wing config validate
   ```

### Configuration File Structure

The configuration is stored in `.no-wing/config.json`:

```json
{
  "developerId": "dev-12345",
  "qId": "q-12345-abc123",
  "qLevel": "standard",
  "region": "us-east-1",
  "setupDate": "2024-01-01T00:00:00.000Z",
  "credentials": {
    "profile": "no-wing-profile",
    "region": "us-east-1"
  },
  "permissions": {
    "requiredPolicies": [],
    "optionalPolicies": [],
    "customPolicies": []
  },
  "audit": {
    "enabled": true,
    "cloudTrailArn": "arn:aws:cloudtrail:us-east-1:123456789012:trail/no-wing-trail",
    "logGroupName": "/aws/no-wing/audit"
  }
}
```

## Usage Guide

### Basic Operations

#### Credential Management

```bash
# Check current status
no-wing status

# Switch credential context
no-wing credentials switch user
no-wing credentials switch no-wing

# Test credentials
no-wing credentials test

# Show current identity
no-wing credentials whoami
```

#### Deployment Operations

```bash
# Deploy with Q credentials
no-wing deploy template.yaml --stack-name my-stack

# Validate deployment (uses user credentials)
no-wing deploy template.yaml --stack-name my-stack --dry-run

# Deploy with parameters
no-wing deploy template.yaml \
  --stack-name my-stack \
  --parameters params.json \
  --tags "Environment=dev,Project=no-wing"

# Rollback deployment
no-wing rollback my-stack
```

#### Permission Management

```bash
# List available roles
no-wing permissions list-roles

# Test role assumption
no-wing permissions test-role arn:aws:iam::123456789012:role/no-wing-deploy

# View permission requests
no-wing permissions requests --status pending
```

#### Audit and Compliance

```bash
# Query audit events
no-wing audit events --start 2024-01-01 --type credential-switch,role-assumption

# Generate compliance report
no-wing audit report --start 2024-01-01 --end 2024-01-31 --format json

# Verify CloudTrail integration
no-wing audit verify-cloudtrail
```

### Programmatic Usage

#### TypeScript/JavaScript

```typescript
import { CredentialManager } from './src/credentials/CredentialManager';
import { AWSClientFactory } from './src/credentials/AWSClientFactory';
import { DeploymentManager } from './src/deployment/DeploymentManager';

// Initialize components
const credentialManager = new CredentialManager();
const clientFactory = new AWSClientFactory(credentialManager);

await credentialManager.initialize();

// Switch to Q context for deployment
await credentialManager.switchToNoWingContext();

// Get AWS clients with Q credentials
const s3Client = await clientFactory.getS3Client();
const cfClient = await clientFactory.getCloudFormationClient();

// Execute deployment
const deploymentManager = new DeploymentManager(/* ... */);
const result = await deploymentManager.deployStack({
  stackName: 'my-stack',
  templatePath: './template.yaml'
});
```

## Security Best Practices

### IAM Policy Design

#### Minimal Q Policy
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "sts:GetCallerIdentity",
        "sts:AssumeRole"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": "sts:AssumeRole",
      "Resource": "arn:aws:iam::*:role/no-wing-*"
    }
  ]
}
```

#### Deployment Role Policy
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudformation:*"
      ],
      "Resource": "arn:aws:cloudformation:*:*:stack/no-wing-*/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::no-wing-*/*"
    }
  ]
}
```

### Trust Relationships

#### Q Service Role Trust Policy
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::123456789012:user/no-wing-service-user"
      },
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringEquals": {
          "sts:ExternalId": "no-wing-external-id"
        }
      }
    }
  ]
}
```

## Troubleshooting

### Common Issues

#### 1. Credential Initialization Fails
```bash
# Check AWS configuration
aws sts get-caller-identity

# Verify no-wing config
no-wing config show
no-wing config validate

# Reset configuration
no-wing setup --profile default
```

#### 2. Role Assumption Fails
```bash
# Test role directly
no-wing permissions test-role arn:aws:iam::123456789012:role/no-wing-deploy

# Check trust relationship
aws iam get-role --role-name no-wing-deploy

# Verify permissions
no-wing permissions list-roles --pattern no-wing
```

#### 3. Deployment Permission Denied
```bash
# Check current context
no-wing credentials whoami

# Switch to Q context
no-wing credentials switch no-wing

# Validate deployment
no-wing deploy template.yaml --dry-run

# Check audit logs
no-wing audit events --type aws-operation --limit 10
```

#### 4. Audit Trail Missing
```bash
# Verify CloudTrail
no-wing audit verify-cloudtrail

# Check local audit log
cat .no-wing/audit.log | tail -10

# Generate test events
no-wing credentials test
no-wing audit events --limit 5
```

### Debug Mode

Enable verbose logging by setting environment variables:

```bash
export NO_WING_DEBUG=true
export NO_WING_LOG_LEVEL=debug

no-wing status --verbose
```

## Compliance and Auditing

### Audit Event Types

1. **credential-switch**: Context changes between user and Q
2. **role-assumption**: Role assumptions for elevated permissions
3. **aws-operation**: All AWS API calls with context attribution
4. **permission-request**: Permission elevation requests and approvals
5. **error**: Failed operations and security violations

### Compliance Reports

Generate compliance reports for different time periods:

```bash
# Daily report
no-wing audit report --start $(date -d '1 day ago' -I) --end $(date -I)

# Monthly report
no-wing audit report --start $(date -d '1 month ago' -I) --end $(date -I) --format json > monthly-report.json

# Custom period
no-wing audit report --start 2024-01-01 --end 2024-01-31
```

### Data Retention

- **Audit logs**: 7 years (configurable)
- **Session data**: 24 hours
- **Permission requests**: 30 days
- **Compliance reports**: 3 years

## Migration Guide

### From Legacy Setup

1. **Backup existing configuration**
   ```bash
   cp -r .no-wing .no-wing.backup
   ```

2. **Migrate configuration**
   ```bash
   no-wing config migrate
   ```

3. **Validate migration**
   ```bash
   no-wing config validate
   no-wing status --verbose
   ```

4. **Test functionality**
   ```bash
   no-wing test:integration
   ```

### Breaking Changes

- Configuration file format updated
- CLI command structure changed
- New required IAM permissions
- Audit log format modified

## API Reference

### CredentialManager

```typescript
class CredentialManager {
  async initialize(): Promise<void>
  async switchToUserContext(): Promise<CredentialContext>
  async switchToNoWingContext(): Promise<CredentialContext>
  async assumeRole(roleArn: string, sessionName?: string): Promise<CredentialContext>
  getCurrentContext(): CredentialContext | null
  async getCredentialStatus(): Promise<CredentialStatus>
}
```

### AWSClientFactory

```typescript
class AWSClientFactory {
  async getClient<T>(serviceType: AWSServiceType, config?: ClientConfig): Promise<T>
  async withContext<T>(contextType: 'user' | 'no-wing', operation: () => Promise<T>): Promise<T>
  async executeAsNoWing<T>(operation: () => Promise<T>): Promise<T>
  async executeAsUser<T>(operation: () => Promise<T>): Promise<T>
}
```

### DeploymentManager

```typescript
class DeploymentManager {
  async deployStack(config: DeploymentConfig, rollbackConfig?: RollbackConfig): Promise<DeploymentResult>
  async rollbackDeployment(stackName: string, region?: string): Promise<DeploymentResult>
  async validateDeployment(config: DeploymentConfig): Promise<ValidationResult>
}
```

## Performance Considerations

### Client Caching

- AWS clients are cached per credential context
- Cache is automatically cleared on context switches
- Manual cache clearing available via `clearCache()`

### Session Management

- Role sessions are cached for 1 hour by default
- Automatic cleanup of expired sessions
- Session validation before reuse

### Audit Buffering

- Events are buffered for batch processing
- Configurable buffer size (default: 100 events)
- Automatic flush on critical events

## Support and Contributing

### Getting Help

1. Check the troubleshooting guide above
2. Review audit logs for error details
3. Run diagnostic commands:
   ```bash
   no-wing status --verbose
   no-wing config validate
   no-wing test:integration
   ```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

### Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:credentials
npm run test:permissions
npm run test:integration

# Generate test report
npm run test:integration > test-results.log
```
