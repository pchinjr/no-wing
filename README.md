# 🛫 no-wing

**Q Service Account Manager - Give Amazon Q its own identity for secure, auditable project automation**

Configure Amazon Q with **credential separation**, dedicated identity, and comprehensive audit trails. Q operates with proper attribution and isolated permissions - never masquerading as you again.

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/pchinjr/no-wing/releases/tag/v1.0.0)
[![TypeScript](https://img.shields.io/badge/language-TypeScript-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## 🎯 The Problem

When you give Amazon Q command line access, it performs actions using YOUR identity:
- ❌ Q commits code as YOU
- ❌ Q deploys with YOUR AWS credentials  
- ❌ Q pushes to git as YOU
- ❌ No clear audit trail of human vs AI actions
- ❌ Security risk if Q is compromised
- ❌ Compliance violations in enterprise environments

## 🛡️ The Solution: Credential Separation

**no-wing** implements **credential separation** between you and Amazon Q:

### 🔐 Dual Identity System
```
┌─────────────────┐    ┌─────────────────┐
│   User Actions  │    │   Q Actions     │
│                 │    │                 │
│ • Configuration │    │ • Deployments   │
│ • Validation    │    │ • Automation    │
│ • Manual Ops    │    │ • Role Mgmt     │
└─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│ User Credentials│    │ Q Credentials   │
│ (Your AWS)      │    │ (Service Acct)  │
└─────────────────┘    └─────────────────┘
         │                       │
         └───────────┬───────────┘
                     ▼
            ┌─────────────────┐
            │   CloudTrail    │
            │ (Audit Trail)   │
            └─────────────────┘
```

### ✅ Key Benefits
- **🔐 Security**: Q uses dedicated service credentials, not your personal AWS access
- **📝 Audit Trail**: Clear separation between human and AI actions in CloudTrail
- **🎯 Least Privilege**: Q gets only the permissions it needs for specific operations
- **🛡️ Compliance**: Full audit logs and compliance reporting for enterprise requirements
- **🔄 Intelligent Permissions**: Automatic role discovery and permission elevation
- **⚡ Performance**: Client caching and session management for efficiency

## ✨ Features

### 🔄 Credential Management
- **Dual Context System**: Separate user and Q credential contexts
- **Automatic Switching**: Context switches based on operation type
- **Session Management**: Efficient role assumption with caching
- **Credential Validation**: Real-time credential status checking

### 🎭 Permission Management
- **Role Discovery**: Automatically finds appropriate roles for operations
- **Smart Elevation**: Intelligent permission escalation with fallback strategies
- **Graceful Degradation**: Read-only validation, dry-runs when permissions insufficient
- **Learning System**: Remembers successful permission patterns

### 📊 Audit & Compliance
- **Structured Logging**: All operations logged with full context attribution
- **CloudTrail Integration**: Seamless integration with AWS CloudTrail
- **Compliance Reports**: Generate detailed reports for security teams
- **Violation Detection**: Automatic detection of security policy violations

### 🚀 Deployment Integration
- **CloudFormation Support**: Full CloudFormation deployment with credential separation
- **Template Validation**: Pre-deployment validation with user credentials
- **Rollback Management**: Automated rollback with audit trails
- **S3 Integration**: Template upload and artifact management

### 💻 Developer Experience
- **CLI Interface**: Comprehensive command-line interface
- **TypeScript API**: Full programmatic access for custom integrations
- **Testing Suite**: Comprehensive test coverage with integration tests
- **Debug Support**: Verbose logging and diagnostic commands

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or [Deno](https://deno.land/) installed
- [Amazon Q CLI](https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/cli-install.html) installed
- AWS CLI configured with your credentials

### Installation

```bash
# Clone the repository
git clone https://github.com/pchinjr/no-wing.git
cd no-wing

# Install dependencies and build
npm install
npm run build

# Or use Deno (legacy support)
./install-deno-final.sh
```

### Setup Q Credentials

```bash
# Setup with AWS profile
no-wing setup --profile no-wing-profile --region us-east-1

# Or setup with IAM role
no-wing setup --role-arn arn:aws:iam::123456789012:role/no-wing-role

# Verify setup
no-wing status --verbose
```

### Basic Usage

```bash
# Deploy with Q credentials (automatic context switching)
no-wing deploy template.yaml --stack-name my-app

# Check credential status
no-wing credentials whoami

# Generate audit report
no-wing audit report --start 2024-01-01 --end 2024-01-31

# List available roles
no-wing permissions list-roles
```

## 📚 Documentation

- **[Credential Separation Guide](docs/CREDENTIAL_SEPARATION.md)** - Complete implementation guide
- **[API Reference](docs/CREDENTIAL_SEPARATION.md#api-reference)** - TypeScript API documentation
- **[Security Best Practices](docs/CREDENTIAL_SEPARATION.md#security-best-practices)** - IAM policies and security guidelines
- **[Troubleshooting](docs/CREDENTIAL_SEPARATION.md#troubleshooting)** - Common issues and solutions

## 🔧 CLI Commands

### Credential Management
```bash
no-wing credentials switch user|no-wing    # Switch credential context
no-wing credentials test                   # Test current credentials
no-wing credentials whoami                 # Show current identity
```

### Deployment Operations
```bash
no-wing deploy <template>                  # Deploy CloudFormation stack
no-wing deploy <template> --dry-run        # Validate without deploying
no-wing rollback <stack-name>              # Rollback deployment
```

### Permission Management
```bash
no-wing permissions list-roles             # List available roles
no-wing permissions test-role <role-arn>   # Test role assumption
no-wing permissions requests               # Show permission requests
```

### Audit & Compliance
```bash
no-wing audit events                       # Query audit events
no-wing audit report                       # Generate compliance report
no-wing audit verify-cloudtrail            # Verify CloudTrail integration
```

### Configuration
```bash
no-wing setup                              # Initial setup
no-wing status                             # Show current status
no-wing config validate                    # Validate IAM setup
```

## 🏗️ Architecture

### Core Components

1. **CredentialManager** - Manages credential contexts and switching
2. **AWSClientFactory** - Provides context-aware AWS SDK clients
3. **RoleManager** - Handles role discovery and assumption
4. **PermissionElevator** - Implements intelligent permission elevation
5. **AuditLogger** - Comprehensive audit logging and compliance
6. **DeploymentManager** - CloudFormation deployment with credential separation
7. **NoWingCLI** - Command-line interface

### Security Model

```
User Operations          Q Operations
     │                       │
     ▼                       ▼
┌─────────────┐    ┌─────────────┐
│ User Creds  │    │ Q Creds     │
│ • Personal  │    │ • Service   │
│ • Limited   │    │ • Scoped    │
│ • Read-only │    │ • Audited   │
└─────────────┘    └─────────────┘
     │                       │
     └───────────┬───────────┘
                 ▼
        ┌─────────────┐
        │ CloudTrail  │
        │ • Separate  │
        │   identities│
        │ • Full      │
        │   audit     │
        └─────────────┘
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:credentials      # Credential management tests
npm run test:permissions      # Permission management tests
npm run test:integration      # Full integration tests

# Build and test
npm run build
npm run test:integration
```

## 🔒 Security Considerations

### IAM Best Practices

1. **Minimal Permissions**: Q gets only required permissions for specific operations
2. **Role-Based Access**: Use role assumption instead of direct permissions
3. **Time-Limited Sessions**: All assumed roles have expiration times
4. **Audit Everything**: All operations are logged with full context

### Recommended IAM Setup

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["sts:GetCallerIdentity", "sts:AssumeRole"],
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

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`npm test`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Amazon Q team for the CLI and developer experience
- AWS SDK team for comprehensive AWS integration
- TypeScript community for excellent tooling
- Open source contributors who make projects like this possible

---

**Made with ❤️ for secure, auditable AI automation**
# 1. Set up Q service account for your project (no sudo required!)
cd your-project
no-wing setup

# 2. Launch Q CLI with service account identity
no-wing launch              # Start Q chat session
no-wing launch help         # Show Q CLI help
no-wing launch --verbose    # Q CLI with verbose output

# 3. Check service account status
no-wing status

# 4. Configure AWS credentials (optional)
no-wing aws-setup

# 5. Clean up when done
no-wing cleanup
```

## ✨ Key Features

### 🔐 Complete Identity Separation
- **Isolated Workspace**: Q operates in `~/.no-wing/service-accounts/{project}/`
- **Git Identity**: Q commits as `Q Assistant (project) <q-assistant+project@no-wing.dev>`
- **AWS Credentials**: Q uses dedicated AWS profile with project-specific permissions
- **Environment Isolation**: Q operates with isolated environment variables

### 🎯 No Sudo Required
- **User-space isolation**: No system user creation needed
- **Workspace-based**: Uses isolated directories in user's home
- **Environment variables**: Overrides git and AWS configurations per session
- **Cross-platform**: Works on Linux, macOS, and Windows

### 📊 Built with Deno
- **Single binary**: No Node.js dependencies or build steps
- **Built-in TypeScript**: Native TypeScript support
- **Secure by default**: Explicit permissions model
- **Cross-platform**: Runs anywhere Deno runs
- **Fast startup**: No dependency resolution

### 🛠️ Smart Project Detection
- **SAM Projects**: Automatic Lambda and API Gateway permissions
- **CDK Projects**: CloudFormation and CDK-specific permissions
- **Generic Projects**: Basic AWS permissions for general use

## 🔧 Commands

### Setup Commands

```bash
# Set up Q service account for current project
no-wing setup

# Force recreate existing service account
no-wing setup --force
```

### Management Commands

```bash
# Check service account status
no-wing status

# Launch Q with service account identity
no-wing launch              # Default: start chat session
no-wing launch help         # Show Q CLI help
no-wing launch --verbose    # Launch with verbose output

# Configure AWS credentials
no-wing aws-setup

# Clean up service account
no-wing cleanup             # Interactive cleanup
no-wing cleanup --force     # Force removal without prompts
```

## 🏗️ How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                        Developer                             │
│                           │                                 │
│                    runs no-wing                             │
│                           │                                 │
├─────────────────────────────────────────────────────────────┤
│                     no-wing CLI (Deno)                     │
│  ┌─────────────────┬─────────────────┬─────────────────┐   │
│  │ ProjectDetector │ ServiceAccount  │ Environment     │   │
│  │                 │ Manager         │ Isolation       │   │
│  └─────────────────┴─────────────────┴─────────────────┘   │
│                           │                                 │
├─────────────────────────────────────────────────────────────┤
│              Service Account Workspace                      │
│  ┌─────────────────┬─────────────────┬─────────────────┐   │
│  │ Git Identity    │ AWS Profile     │ Launch Scripts  │   │
│  │ Q Assistant     │ Isolated Creds  │ Environment     │   │
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
~/.no-wing/service-accounts/{project}/
├── .aws/
│   ├── credentials              # Q's AWS credentials
│   └── config                   # Q's AWS configuration
├── .gitconfig                   # Q's git identity
├── .ssh/                        # SSH keys (if needed)
├── bin/
│   ├── launch-q                 # Q launch script
│   └── status                   # Status check script
├── logs/
│   └── sessions.log             # Q session audit log
└── workspace/                   # Q's working directory
```

## 🛡️ Security

### Identity Separation
- Q operates with dedicated git identity per project
- Complete workspace isolation from your user files
- Separate AWS credentials with minimal required permissions
- Git commits clearly attributed to Q Assistant

### Permission Management
- Project-specific AWS policies (principle of least privilege)
- AWS credentials isolated per project
- Complete audit trail of all Q activities
- No system-level changes required

## 🔍 Troubleshooting

### Deno Not Found
```bash
# Install Deno
curl -fsSL https://deno.land/x/install/install.sh | sh

# Add to PATH
echo 'export PATH="$HOME/.deno/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Verify installation
deno --version
```

### Q CLI Not Found
```bash
# Check Q CLI installation
which q

# Install Q CLI (follow AWS documentation)
# Visit: https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/cli-install.html
```

### Service Account Issues
```bash
# Check service account status
no-wing status

# Recreate service account
no-wing cleanup --force && no-wing setup

# Check workspace structure
ls -la ~/.no-wing/service-accounts/{project}/
```

## 🤝 Contributing

We welcome contributions! Please see our [contributing guidelines](docs/CONTRIBUTING.md):

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** with tests
4. **Test with Deno**: `deno run --allow-all deno/no-wing.ts --help`
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to the branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Development Setup

```bash
# Clone the repository
git clone https://github.com/pchinjr/no-wing.git
cd no-wing

# Test locally
deno run --allow-all deno/no-wing.ts --help
deno run --allow-all deno/no-wing.ts setup --force

# Install globally for testing
./install-deno-final.sh
```

## 📚 Documentation

- **[Technical Implementation](docs/DENO_MIGRATION.md)** - Deep dive into Deno implementation
- **[Documentation Index](docs/README.md)** - Complete documentation overview
- **[AWS Q Developer Documentation](https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/)** - Official Q documentation

## 🆚 Why Deno?

We migrated from Node.js to Deno for several key reasons:

- **No sudo required**: Eliminates Node.js + sudo PATH issues
- **Single binary**: No build steps or dependency management
- **Built-in TypeScript**: Native TypeScript support
- **Secure by default**: Explicit permissions model
- **Cross-platform**: Consistent behavior across operating systems
- **Fast startup**: No dependency resolution overhead

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Amazon Q Developer** - The AI assistant that inspired this security solution
- **Deno Team** - For creating an excellent runtime for system utilities
- **AWS IAM** - For providing the foundation for secure service account management

---

**🛫 Give Amazon Q its own wings - secure, auditable, and properly attributed.**

**Built with Deno. No sudo required. No dependencies. Just works.**
