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
- ✅ **NEW**: Seamless Q CLI integration with identity separation

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
no-wing setup

# 2. Launch Q CLI with service account identity
no-wing launch                    # Start Q chat session
no-wing launch chat --verbose     # Q CLI with arguments
no-wing launch help               # Show Q CLI help

# 3. Check service account status
no-wing status

# 4. View Q session activity
no-wing audit

# 5. Clean up when done
no-wing teardown
```

## ✨ Key Features

### 🔐 Complete Identity Separation
- **Local User Account**: Q runs as `q-assistant-{project}` user
- **Git Identity**: Q commits as `Q Assistant (project) <q-assistant+project@no-wing.dev>`
- **AWS Credentials**: Q uses dedicated IAM user with project-specific permissions
- **Workspace Isolation**: Q operates in isolated workspace with project files

### 🎯 Seamless Q CLI Integration
- **Real Q CLI Execution**: No simulation - actual Q CLI with service account identity
- **Full Argument Support**: Pass any Q CLI commands and options
- **Interactive Experience**: Complete stdio pass-through for Q CLI chat
- **Security Validation**: Dangerous options blocked (--profile, --credentials)
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
- **Custom Policies**: Support for project-specific permission requirements

## 🏗️ Architecture

### System Overview

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

### Core Services

- **ProjectDetector**: Smart project type detection (SAM, CDK, generic)
- **ServiceAccountManager**: Complete service account lifecycle management
- **AWSIdentityManager**: AWS IAM user and credential management
- **PolicyGenerator**: Project-specific AWS permission generation
- **QSessionManager**: Q CLI session management with identity isolation
- **QCliDetector**: Q CLI availability and compatibility checking
- **QCliArgumentParser**: Secure argument parsing and validation

## 📋 Commands

### Setup Commands

```bash
# Set up Q service account for current project
no-wing setup

# Set up with custom AWS profile
no-wing setup --aws-profile my-profile

# Set up with specific AWS region
no-wing setup --region us-west-2
```

### Launch Commands

```bash
# Launch Q CLI with service account identity
no-wing launch                    # Default: start chat session
no-wing launch chat               # Explicit chat session
no-wing launch chat --verbose     # Chat with verbose output
no-wing launch help               # Show Q CLI help
no-wing launch --version          # Show Q CLI version

# Launch with no-wing options
no-wing launch --verbose chat     # Show launch details + Q CLI
no-wing launch --background       # Launch without prompts
```

### Management Commands

```bash
# Check service account status
no-wing status                    # Basic status
no-wing status --verbose          # Detailed status with all components

# View Q session activity
no-wing audit                     # Recent Q sessions
no-wing audit --all               # All Q session history

# Clean up service account
no-wing teardown                  # Remove Q service account
no-wing teardown --force          # Force removal without prompts
```

### Utility Commands

```bash
# Show version information
no-wing --version

# Show help
no-wing --help
no-wing launch --help

# Easter egg
no-wing nothing                   # Jon Snow knows nothing
```

## 🔧 Configuration

### Project Types

no-wing automatically detects your project type and configures appropriate permissions:

#### SAM Projects
- **Detection**: `template.yaml` or `template.yml`
- **Permissions**: Lambda, API Gateway, CloudFormation, S3, IAM
- **Deploy Command**: `sam deploy`

#### CDK Projects  
- **Detection**: `cdk.json`
- **Permissions**: CloudFormation, CDK, S3, IAM, EC2, Lambda
- **Deploy Command**: `cdk deploy`

#### Generic Projects
- **Detection**: Fallback for any project
- **Permissions**: Basic AWS services (S3, Lambda, CloudFormation)
- **Deploy Command**: Custom or manual

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

# Run specific test suites
npm run test:unit                 # Unit tests only
npm run test:integration          # Integration tests only

# Test coverage
npm run test:coverage
```

**Test Statistics:**
- **295 total tests** with 100% pass rate
- **Unit tests**: Core service functionality
- **Integration tests**: End-to-end workflows
- **Security tests**: Permission and validation logic

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

### Validation
- Q CLI argument validation and sanitization
- AWS credential validation before use
- Project type validation and permission scoping
- Service account health checking

## 🔍 Troubleshooting

### Q CLI Not Found
```bash
# Check Q CLI installation
no-wing launch --verbose

# Install Q CLI (example for macOS)
brew install amazon-q

# Or download from AWS
# Visit: https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/cli-install.html
```

### Service Account Issues
```bash
# Check service account status
no-wing status --verbose

# Recreate service account
no-wing teardown && no-wing setup

# Check AWS credentials
aws sts get-caller-identity --profile q-assistant-{project}
```

### Permission Issues
```bash
# Verify AWS permissions
no-wing status --verbose

# Check IAM user policies
aws iam list-attached-user-policies --user-name q-assistant-{project}

# Update permissions (recreate service account)
no-wing teardown && no-wing setup
```

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

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

# Test locally
node dist/cli/index.js --help
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Amazon Q Developer** - The AI assistant that inspired this security solution
- **AWS IAM** - For providing the foundation for secure service account management
- **The Node.js Community** - For the excellent tooling and libraries

## 📚 Additional Resources

- **[Q CLI Integration Guide](Q_CLI_INTEGRATION.md)** - Technical details of Q CLI integration
- **[AWS Q Developer Documentation](https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/)** - Official Q documentation
- **[AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)** - Security guidelines

---

**🛫 Give Amazon Q its own wings - secure, auditable, and properly attributed.**
