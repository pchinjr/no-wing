# No-wing Installation Guide

## Prerequisites

- [Deno](https://deno.land/) runtime installed
- AWS CLI configured with appropriate credentials
- Git (for installation from source)

## Installation

### Option 1: Direct Execution (Recommended for Development)

```bash
# Clone the repository
git clone <repository-url>
cd no-wing

# Make executable
chmod +x no-wing

# Run directly
./no-wing help
```

### Option 2: Install to PATH

```bash
# Clone and setup
git clone <repository-url>
cd no-wing
chmod +x no-wing

# Copy to a directory in your PATH
sudo cp no-wing /usr/local/bin/
# or
cp no-wing ~/.local/bin/  # if ~/.local/bin is in your PATH
```

### Option 3: Deno Install (Future)

```bash
# This will be available once published
deno install --allow-all --name no-wing https://deno.land/x/no-wing/no-wing
```

## Quick Start

1. **Setup credentials:**
   ```bash
   ./no-wing setup --profile my-aws-profile --region us-east-1
   ```

2. **Check status:**
   ```bash
   ./no-wing status
   ```

3. **Test credentials:**
   ```bash
   ./no-wing credentials test
   ```

4. **Deploy a CloudFormation stack:**
   ```bash
   ./no-wing deploy my-template.yaml --stack-name my-stack
   ```

## Command Overview

### Core Commands
- `setup` - Initial configuration and credential setup
- `status` - Show current system status
- `deploy` - Deploy CloudFormation stacks with Q credentials
- `rollback` - Rollback CloudFormation deployments

### Credential Management
- `credentials switch <context>` - Switch between user/Q contexts
- `credentials test` - Test current credentials
- `credentials whoami` - Show current identity

### Permission Management
- `permissions list` - List available roles
- `permissions request <role>` - Request role elevation
- `permissions approve <request-id>` - Approve permission request

### Audit & Compliance
- `audit events` - Query audit events
- `audit report` - Generate compliance reports
- `audit verify-cloudtrail` - Verify CloudTrail integration

### Configuration
- `config show` - Display current configuration
- `config validate` - Validate configuration
- `config migrate` - Migrate configuration format

## Permissions Required

### User Credentials
- Basic AWS API access
- IAM permissions to assume Q service roles
- CloudFormation read permissions

### Q Service Account
- Full CloudFormation permissions
- Resource creation/modification permissions
- CloudTrail logging permissions
- CloudWatch logging permissions

## Troubleshooting

### Common Issues

1. **Configuration not found:**
   ```bash
   ./no-wing setup --profile default --region us-east-1
   ```

2. **Permission denied:**
   - Ensure AWS credentials are configured
   - Check IAM policies and role trust relationships

3. **Deno permission errors:**
   - The script requires `--allow-all` for file system and network access
   - This is necessary for AWS SDK operations and configuration management

### Debug Mode

Enable verbose logging:
```bash
DENO_LOG=debug ./no-wing <command>
```

## Security Considerations

- Q credentials are isolated from user credentials
- All operations are logged for audit purposes
- Role assumptions are time-limited and tracked
- CloudTrail integration provides compliance reporting

## Development

### Running Tests
```bash
./no-wing test  # Run integration tests
deno test       # Run unit tests (when available)
```

### Linting
```bash
deno lint
```

### Formatting
```bash
deno fmt
```
