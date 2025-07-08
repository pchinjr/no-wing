# 🛫 no-wing

**Q Service Account Manager - Give Amazon Q its own identity for secure, auditable project automation**

Configure Amazon Q with its own local user account, AWS credentials, and git identity per project. Q operates as a dedicated service account with proper attribution and isolated permissions - never masquerading as you again.

[![Version](https://img.shields.io/badge/version-0.2.0-blue.svg)](https://github.com/pchinjr/no-wing/releases/tag/v0.2.0)
[![Tests](https://img.shields.io/badge/tests-295%20passing-green.svg)](#testing)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## 🎯 The Problem

When you give Amazon Q command line access, it performs actions using YOUR identity:
- ❌ Q commits code as YOU
- ❌ Q deploys with YOUR AWS credentials  
- ❌ Q pushes to git as YOU
- ❌ No clear audit trail of human vs AI actions
- ❌ Security risk if Q is compromised

## 🛡️ The Solution

**no-wing** creates a dedicated service account for Q in each project:
- ✅ Q has its own local user account (`q-assistant-{project}`)
- ✅ Q commits with its own git identity (`Q Assistant (project)`)
- ✅ Q uses its own AWS credentials with scoped permissions
- ✅ Complete audit trail of Q vs human actions
- ✅ **Seamless Q CLI integration** with identity separation

## 🚀 Quick Start

### Installation

```bash
# Install no-wing globally
npm install -g no-wing

# Or run directly with npx
npx no-wing --help
```

### Basic Usage

```bash
# 1. Set up Q service account for your project
sudo no-wing setup               # Requires sudo for user account creation

# 2. Launch Q CLI with service account identity
sudo no-wing launch              # Start Q chat session
sudo no-wing launch chat --verbose  # Q CLI with arguments
sudo no-wing launch help         # Show Q CLI help

# 3. Check service account status
no-wing status                   # Basic status check
sudo no-wing status --verbose    # Detailed status (may require sudo)

# 4. View Q session activity
no-wing audit

# 5. Clean up when done
sudo no-wing teardown            # Requires sudo for user removal
```

> **Note**: Service account operations require `sudo` privileges for creating/managing local user accounts and accessing service account files.

## ✨ Key Features

### 🔐 Complete Identity Separation
- **Local User Account**: Q runs as `q-assistant-{project}` user
- **Git Identity**: Q commits as `Q Assistant (project) <q-assistant+project@no-wing.dev>`
- **AWS Credentials**: Q uses dedicated IAM user with project-specific permissions
- **Workspace Isolation**: Q operates in isolated workspace with project files

### 🎯 Seamless Q CLI Integration
- **Real Q CLI Execution**: Actual Q CLI with service account identity
- **Full Argument Support**: Pass any Q CLI commands and options
- **Interactive Experience**: Complete Q CLI chat experience
- **Security Validation**: Dangerous options blocked automatically
- **Graceful Fallback**: Helpful guidance when Q CLI not installed

### 📊 Comprehensive Auditing
- **Session Logging**: Complete audit trail of Q activities
- **Git Attribution**: Clear separation of human vs Q commits
- **AWS Activity**: Q actions tracked under dedicated IAM user
- **Project Isolation**: Each project has its own Q service account

### 🛠️ Smart Project Detection
- **SAM Projects**: Automatic Lambda and API Gateway permissions
- **CDK Projects**: CloudFormation and CDK-specific permissions
- **Generic Projects**: Basic AWS permissions for general use

## 🔐 Permissions and Sudo Requirements

### Why Sudo is Required

no-wing creates and manages dedicated local user accounts for Q service accounts. This requires administrative privileges for:

- **User Account Management**: Creating, configuring, and removing local users
- **File System Access**: Setting up home directories and workspace isolation
- **Service Account Files**: Accessing and configuring service account-specific files
- **Process Execution**: Running Q CLI as the dedicated service account user

### Commands Requiring Sudo

| Command | Sudo Required | Reason |
|---------|---------------|---------|
| `setup` | ✅ Always | Creates local user accounts and configures files |
| `launch` | ⚠️ Usually | Health checks and Q CLI execution with service account identity |
| `status --verbose` | ⚠️ Sometimes | Accessing service account configuration files |
| `teardown` | ✅ Always | Removes local user accounts and cleans up files |
| `audit` | ❌ No | Reads audit logs accessible to current user |

### Alternative: Group Permissions

For development environments, you can configure group permissions to reduce sudo requirements:

```bash
# Add your user to the service account group (after setup)
sudo usermod -a -G q-assistant-{project} $USER

# Make service account files group-readable
sudo chmod -R g+r /home/q-assistant-{project}/

# Start a new shell session for group membership to take effect
newgrp q-assistant-{project}
```

> **Security Note**: Group permissions reduce security isolation. Use sudo approach for production environments.

## 📋 Commands

### Setup Commands

```bash
# Set up Q service account for current project
sudo no-wing setup

# Set up with custom AWS profile or region
sudo no-wing setup --aws-profile my-profile --region us-west-2

# Set up without AWS integration (for testing)
sudo no-wing setup --skip-aws

# Show what would be created without making changes
sudo no-wing setup --dry-run

# Force recreate existing service account
sudo no-wing setup --force
```

> **Important**: Setup requires `sudo` privileges to create local user accounts and configure service account files.

### Launch Commands

```bash
# Launch Q CLI with service account identity
sudo no-wing launch              # Default: start chat session
sudo no-wing launch chat         # Explicit chat session
sudo no-wing launch chat --verbose  # Chat with verbose output
sudo no-wing launch help         # Show Q CLI help
sudo no-wing launch --version    # Show Q CLI version

# Launch with no-wing options
sudo no-wing launch --verbose chat     # Show launch details + Q CLI
sudo no-wing launch --background       # Launch without prompts
```

> **Note**: Launch may require `sudo` for service account health checks and Q CLI execution with proper identity.

### Management Commands

```bash
# Check service account status
no-wing status                    # Basic status
sudo no-wing status --verbose     # Detailed status (may require sudo)

# View Q session activity
no-wing audit                     # Recent Q sessions
no-wing audit --all               # All Q session history

# Clean up service account
sudo no-wing teardown             # Remove Q service account
sudo no-wing teardown --force     # Force removal without prompts
```

> **Note**: Some status checks and all teardown operations require `sudo` for accessing service account files and removing user accounts.

## 🏗️ How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                        Developer                             │
│                           │                                 │
│                    runs no-wing                             │
│                           │                                 │
├─────────────────────────────────────────────────────────────┤
│                     no-wing CLI                             │
│  ┌─────────────────┬─────────────────┬─────────────────┐   │
│  │ ProjectDetector │ ServiceAccount  │ QSessionManager │   │
│  │                 │ Manager         │                 │   │
│  └─────────────────┴─────────────────┴─────────────────┘   │
│                           │                                 │
├─────────────────────────────────────────────────────────────┤
│                  Service Account Layer                      │
│  ┌─────────────────┬─────────────────┬─────────────────┐   │
│  │ Local User      │ Git Identity    │ AWS Credentials │   │
│  │ q-assistant-*   │ Q Assistant     │ IAM User        │   │
│  └─────────────────┴─────────────────┴─────────────────┘   │
│                           │                                 │
├─────────────────────────────────────────────────────────────┤
│                    Amazon Q CLI                             │
│              (runs with service account identity)           │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Configuration

### Project Types

no-wing automatically detects your project type and configures appropriate permissions:

#### SAM Projects
- **Detection**: `template.yaml` or `template.yml`
- **Permissions**: Lambda, API Gateway, CloudFormation, S3, IAM

#### CDK Projects  
- **Detection**: `cdk.json`
- **Permissions**: CloudFormation, CDK, S3, IAM, EC2, Lambda

#### Generic Projects
- **Detection**: Fallback for any project
- **Permissions**: Basic AWS services (S3, Lambda, CloudFormation)

### Service Account Structure

```
/home/q-assistant-{project}/
├── .aws/
│   ├── credentials              # Q's AWS credentials
│   └── config                   # Q's AWS configuration
├── .gitconfig                   # Q's git identity
├── .no-wing/
│   ├── logs/
│   │   └── q-sessions.log       # Q session audit log
│   └── workspace/
│       ├── project/             # Synced project files
│       └── sessions/            # Q session data
└── .bashrc                      # Q's shell environment
```

## 🧪 Testing

no-wing includes comprehensive test coverage:

```bash
# Run all tests
npm test

# Test coverage
npm run test:coverage
```

**Test Statistics:**
- **295 total tests** with 100% pass rate
- Complete coverage of core functionality
- Security and validation testing
- End-to-end integration tests

## 🛡️ Security

### Identity Separation
- Q operates under dedicated local user account
- Complete filesystem isolation from your user
- Separate AWS credentials with minimal required permissions
- Git commits clearly attributed to Q Assistant

### Permission Management
- Project-specific AWS policies (principle of least privilege)
- Dangerous Q CLI options blocked (--profile, --credentials)
- AWS credentials never exposed to Q CLI directly
- Complete audit trail of all Q activities

## 🔍 Troubleshooting

### Q CLI Not Found
```bash
# Check Q CLI installation
sudo no-wing launch --verbose

# Install Q CLI (example for macOS)
brew install amazon-q

# Install Q CLI (Linux)
# Download from AWS and follow installation instructions
# Visit: https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/cli-install.html
```

### Service Account Issues
```bash
# Check service account status
sudo no-wing status --verbose

# Recreate service account
sudo no-wing teardown --force && sudo no-wing setup

# Check AWS credentials (if AWS integration enabled)
aws sts get-caller-identity --profile q-assistant-{project}
```

### Permission Issues
```bash
# Most common issue: Missing sudo
sudo no-wing setup    # Instead of: no-wing setup
sudo no-wing launch    # Instead of: no-wing launch

# Check if service account user exists
id q-assistant-{project}

# Check service account home directory
sudo ls -la /home/q-assistant-{project}/

# Verify git configuration
sudo cat /home/q-assistant-{project}/.gitconfig
```

### Node.js Path Issues with Sudo
```bash
# If you get "node: command not found" with sudo
which node
# Use full path: sudo /path/to/node dist/cli/index.js setup

# Or add node to sudo PATH
sudo env "PATH=$PATH" no-wing setup
```

### Health Check Failures
```bash
# Service account exists but health check fails
sudo no-wing status --verbose    # Check detailed status
sudo no-wing setup --force       # Recreate service account

# Alternative: Configure group permissions (development only)
sudo usermod -a -G q-assistant-{project} $USER
sudo chmod -R g+r /home/q-assistant-{project}/
newgrp q-assistant-{project}
```

## 🤝 Contributing

We welcome contributions! Please see our [contributing guidelines](docs/CONTRIBUTING.md):

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** with tests
4. **Run the test suite**: `npm test`
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to the branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Development Setup

```bash
# Clone the repository
git clone https://github.com/pchinjr/no-wing.git
cd no-wing

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Test locally (requires sudo for service account operations)
sudo node dist/cli/index.js --help
sudo node dist/cli/index.js setup --skip-aws    # Test without AWS
sudo node dist/cli/index.js launch --verbose help  # Test Q CLI integration
```

> **Development Note**: Testing service account functionality requires sudo privileges. Use `--skip-aws` for local testing without AWS credentials.

## 📚 Documentation

- **[Technical Implementation](docs/Q_CLI_INTEGRATION.md)** - Deep dive into Q CLI integration
- **[Documentation Index](docs/README.md)** - Complete documentation overview
- **[AWS Q Developer Documentation](https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/)** - Official Q documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Amazon Q Developer** - The AI assistant that inspired this security solution
- **AWS IAM** - For providing the foundation for secure service account management
- **The Node.js Community** - For the excellent tooling and libraries

---

**🛫 Give Amazon Q its own wings - secure, auditable, and properly attributed.**
