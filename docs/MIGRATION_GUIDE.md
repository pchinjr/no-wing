# Migration Guide: Upgrading to Credential Separation

This guide helps existing no-wing users migrate to the new credential separation system.

## Overview of Changes

The new credential separation feature introduces significant architectural changes:

### What's New
- **Dual credential contexts** (user vs Q)
- **Intelligent permission management** with role assumption
- **Comprehensive audit logging** with CloudTrail integration
- **TypeScript-based architecture** (migrating from Deno)
- **Enhanced CLI** with new commands and options

### What's Changed
- Configuration file format updated
- CLI command structure enhanced
- New IAM permission requirements
- Audit log format modified
- Package management (npm instead of Deno-only)

## Pre-Migration Checklist

Before starting the migration:

1. **Backup your current setup**
   ```bash
   cp -r .no-wing .no-wing.backup
   git stash  # Save any uncommitted changes
   ```

2. **Document current configuration**
   ```bash
   # Save current config
   cat .no-wing/config.json > config-backup.json
   
   # Note current AWS credentials
   aws sts get-caller-identity > current-identity.json
   ```

3. **Verify git status**
   ```bash
   git status
   git log --oneline -5  # Note recent commits
   ```

## Step-by-Step Migration

### Step 1: Update the Repository

```bash
# Pull latest changes
git checkout main
git pull origin main

# Switch to the new feature branch (or main if merged)
git checkout feature/q-credential-separation
# OR if merged to main:
# git pull origin main
```

### Step 2: Install New Dependencies

```bash
# Install Node.js dependencies
npm install

# Build the TypeScript code
npm run build
```

### Step 3: Migrate Configuration

```bash
# Run the automatic migration
no-wing config migrate

# Verify the migration
no-wing config show
no-wing config validate
```

### Step 4: Setup Credential Separation

```bash
# Setup Q credentials (choose one method)

# Method 1: Using AWS profile
no-wing setup --profile no-wing-profile --region us-east-1

# Method 2: Using IAM role
no-wing setup --role-arn arn:aws:iam::123456789012:role/no-wing-role

# Method 3: Interactive setup
no-wing setup
```

### Step 5: Validate the Migration

```bash
# Check overall status
no-wing status --verbose

# Test credential switching
no-wing credentials switch user
no-wing credentials whoami

no-wing credentials switch no-wing
no-wing credentials whoami

# Test basic functionality
no-wing permissions list-roles
no-wing audit events --limit 5
```

### Step 6: Update IAM Policies

The new system requires updated IAM policies. Apply these changes:

#### For Q Service User/Role

**Minimal Policy (Recommended)**:
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

#### Create Deployment Roles

Create specific roles for different operations:

```bash
# Example: Create deployment role
aws iam create-role \
  --role-name no-wing-deploy-role \
  --assume-role-policy-document file://trust-policy.json

aws iam attach-role-policy \
  --role-name no-wing-deploy-role \
  --policy-arn arn:aws:iam::aws:policy/CloudFormationFullAccess
```

### Step 7: Test End-to-End Functionality

```bash
# Run the integration test suite
npm run test:integration

# Test a simple deployment (dry-run)
no-wing deploy test-template.yaml --stack-name test-migration --dry-run

# Generate an audit report
no-wing audit report --start $(date -d '1 hour ago' -I) --end $(date -I)
```

## Configuration File Changes

### Old Format (.no-wing/config.json)
```json
{
  "developerId": "dev-123",
  "qId": "q-123",
  "region": "us-east-1",
  "setupDate": "2024-01-01T00:00:00.000Z"
}
```

### New Format (.no-wing/config.json)
```json
{
  "developerId": "dev-123",
  "qId": "q-123",
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
    "cloudTrailArn": "arn:aws:cloudtrail:us-east-1:123456789012:trail/no-wing-trail"
  }
}
```

## CLI Command Changes

### New Commands
```bash
# Credential management
no-wing credentials switch user|no-wing
no-wing credentials test
no-wing credentials whoami

# Permission management
no-wing permissions list-roles
no-wing permissions test-role <role-arn>
no-wing permissions requests

# Audit and compliance
no-wing audit events
no-wing audit report
no-wing audit verify-cloudtrail

# Enhanced deployment
no-wing deploy <template> --dry-run
no-wing rollback <stack-name>
```

### Enhanced Existing Commands
```bash
# Setup now supports multiple credential methods
no-wing setup --profile <profile>
no-wing setup --role-arn <arn>

# Status now shows credential contexts
no-wing status --verbose

# Config commands enhanced
no-wing config validate
no-wing config migrate
```

## Troubleshooting Migration Issues

### Issue 1: Configuration Migration Fails

**Symptoms**: `no-wing config migrate` fails with validation errors

**Solution**:
```bash
# Reset configuration
rm .no-wing/config.json
no-wing setup --profile default

# Manually recreate configuration
no-wing config show
```

### Issue 2: Credential Context Switching Fails

**Symptoms**: `no-wing credentials switch no-wing` fails

**Solution**:
```bash
# Verify Q credentials are configured
no-wing config validate

# Check AWS profile/role exists
aws sts get-caller-identity --profile no-wing-profile

# Reconfigure if needed
no-wing setup --profile no-wing-profile
```

### Issue 3: Permission Denied Errors

**Symptoms**: AWS operations fail with permission denied

**Solution**:
```bash
# Check current context
no-wing credentials whoami

# Switch to appropriate context
no-wing credentials switch no-wing

# Verify role assumption works
no-wing permissions test-role arn:aws:iam::123456789012:role/no-wing-deploy
```

### Issue 4: Audit Logs Missing

**Symptoms**: No audit events showing up

**Solution**:
```bash
# Check audit configuration
no-wing config show | grep -A 5 audit

# Verify CloudTrail integration
no-wing audit verify-cloudtrail

# Check local audit log
cat .no-wing/audit.log | tail -10
```

### Issue 5: Tests Failing

**Symptoms**: Integration tests fail after migration

**Solution**:
```bash
# Clean and rebuild
npm run clean
npm install
npm run build

# Run tests individually
npm run test:credentials
npm run test:permissions

# Check test configuration
cat .no-wing/test-config.json
```

## Rollback Procedure

If you need to rollback to the previous version:

### Step 1: Restore Backup
```bash
# Stop any running processes
pkill -f no-wing

# Restore configuration
rm -rf .no-wing
mv .no-wing.backup .no-wing

# Restore git state if needed
git stash pop  # If you stashed changes
```

### Step 2: Switch Git Branch
```bash
# Switch back to main branch (pre-migration)
git checkout main

# Or switch to a specific commit
git checkout <commit-hash-before-migration>
```

### Step 3: Reinstall Dependencies
```bash
# If using Deno version
./install-deno-final.sh

# Verify functionality
no-wing status
```

## Post-Migration Verification

After successful migration, verify these items:

### ✅ Functionality Checklist
- [ ] Configuration loads without errors
- [ ] Credential contexts switch successfully
- [ ] AWS operations work in both contexts
- [ ] Audit events are being logged
- [ ] CloudTrail integration is working
- [ ] Deployment operations complete successfully
- [ ] Permission elevation works as expected
- [ ] CLI commands respond correctly

### ✅ Security Checklist
- [ ] Q uses separate credentials from user
- [ ] CloudTrail shows distinct identities
- [ ] IAM policies follow least privilege
- [ ] Audit logs contain all required information
- [ ] No overly permissive policies attached
- [ ] Role assumption works correctly

### ✅ Performance Checklist
- [ ] Commands respond in reasonable time
- [ ] Client caching is working
- [ ] Session management is efficient
- [ ] No memory leaks in long-running operations

## Getting Help

If you encounter issues during migration:

1. **Check the logs**:
   ```bash
   export NO_WING_DEBUG=true
   no-wing status --verbose
   ```

2. **Run diagnostics**:
   ```bash
   no-wing config validate
   npm run test:integration
   ```

3. **Review documentation**:
   - [Credential Separation Guide](CREDENTIAL_SEPARATION.md)
   - [Troubleshooting Section](CREDENTIAL_SEPARATION.md#troubleshooting)

4. **Create an issue**:
   - Include migration steps attempted
   - Attach relevant log files
   - Specify your environment details

## Benefits After Migration

Once migration is complete, you'll have:

- **Enhanced Security**: Clear separation between user and Q actions
- **Better Compliance**: Comprehensive audit trails and reporting
- **Improved Reliability**: Intelligent permission management with fallbacks
- **Greater Visibility**: Detailed logging and monitoring capabilities
- **Future-Proof Architecture**: TypeScript-based system with comprehensive testing

The migration effort pays off with a more secure, auditable, and maintainable system for Q automation.
