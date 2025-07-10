# No-wing Installation Guide

## Prerequisites

- [Deno](https://deno.land/) runtime installed (v1.40+)
- AWS CLI configured with appropriate credentials
- Git (for installation from source)

## Installation

### Option 1: Automated Installation (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd no-wing

# Install for current user
./install.sh

# OR install system-wide (requires sudo)
./install.sh --system
```

### Option 2: Manual Installation

#### User Installation
```bash
# Clone and setup
git clone <repository-url>
cd no-wing

# Create installation directory
mkdir -p ~/.local/share/no-wing
mkdir -p ~/.local/bin

# Copy files
cp -r src/ ~/.local/share/no-wing/
cp no-wing ~/.local/share/no-wing/
cp main.ts ~/.local/share/no-wing/

# Create wrapper script
cat > ~/.local/bin/no-wing << 'EOF'
#!/bin/bash
cd "$HOME/.local/share/no-wing" && ./no-wing "$@"
EOF

chmod +x ~/.local/bin/no-wing

# Add to PATH if needed
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.bashrc
source ~/.bashrc
```

#### System Installation
```bash
# Clone and setup
git clone <repository-url>
cd no-wing

# Create installation directory (requires sudo)
sudo mkdir -p /opt/no-wing

# Copy files
sudo cp -r src/ /opt/no-wing/
sudo cp no-wing /opt/no-wing/
sudo cp main.ts /opt/no-wing/
sudo chmod +x /opt/no-wing/no-wing

# Create system wrapper
sudo tee /usr/local/bin/no-wing << 'EOF'
#!/bin/bash
cd "/opt/no-wing" && ./no-wing "$@"
EOF

sudo chmod +x /usr/local/bin/no-wing
```

### Option 3: Direct Execution (Development)

```bash
# Clone the repository
git clone <repository-url>
cd no-wing

# Run directly
./no-wing help
```

## Verification

Test your installation:

```bash
# Check if command is available
which no-wing

# Test basic functionality
no-wing help
no-wing status
```

## Quick Start

1. **Setup credentials:**
   ```bash
   no-wing setup --profile my-aws-profile --region us-east-1
   ```

2. **Check status:**
   ```bash
   no-wing status
   ```

3. **Test credentials:**
   ```bash
   no-wing credentials test
   ```

4. **Deploy a CloudFormation stack:**
   ```bash
   no-wing deploy my-template.yaml --stack-name my-stack
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

1. **Command not found:**
   ```bash
   # Check if installed
   which no-wing
   
   # Check PATH (for user installation)
   echo $PATH | grep -o "$HOME/.local/bin"
   
   # Add to PATH if missing
   export PATH="$PATH:$HOME/.local/bin"
   ```

2. **Configuration not found:**
   ```bash
   no-wing setup --profile default --region us-east-1
   ```

3. **Permission denied:**
   - Ensure AWS credentials are configured
   - Check IAM policies and role trust relationships

4. **Deno permission errors:**
   - The script requires `--allow-all` for file system and network access
   - This is necessary for AWS SDK operations and configuration management

### Debug Mode

Enable verbose logging:
```bash
DENO_LOG=debug no-wing <command>
```

### Reinstallation

If you need to reinstall:

```bash
# Remove existing installation
rm -rf ~/.local/share/no-wing ~/.local/bin/no-wing
# OR for system installation
sudo rm -rf /opt/no-wing /usr/local/bin/no-wing

# Then reinstall
./install.sh
```

## Uninstallation

### User Installation
```bash
rm -rf ~/.local/share/no-wing
rm ~/.local/bin/no-wing
```

### System Installation
```bash
sudo rm -rf /opt/no-wing
sudo rm /usr/local/bin/no-wing
```

## Security Considerations

- Q credentials are isolated from user credentials
- All operations are logged for audit purposes
- Role assumptions are time-limited and tracked
- CloudTrail integration provides compliance reporting

## Development

### Running Tests
```bash
cd /path/to/no-wing/source
./no-wing test  # Run integration tests
deno test       # Run unit tests (when available)
```

### Linting
```bash
cd /path/to/no-wing/source
deno lint
```

### Formatting
```bash
cd /path/to/no-wing/source
deno fmt
```
