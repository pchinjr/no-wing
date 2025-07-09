# 🛫 no-wing

**Q Service Account Manager - Give Amazon Q its own identity for secure, auditable project automation**

Configure Amazon Q with isolated workspaces, dedicated git identity, and AWS credentials per project. Q operates with proper attribution and isolated permissions - never masquerading as you again.

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/pchinjr/no-wing/releases/tag/v1.0.0)
[![Deno](https://img.shields.io/badge/runtime-Deno-00ADD8.svg)](https://deno.land/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## 🎯 The Problem

When you give Amazon Q command line access, it performs actions using YOUR identity:
- ❌ Q commits code as YOU
- ❌ Q deploys with YOUR AWS credentials  
- ❌ Q pushes to git as YOU
- ❌ No clear audit trail of human vs AI actions
- ❌ Security risk if Q is compromised

## 🛡️ The Solution

**no-wing** creates isolated service account workspaces for Q in each project:
- ✅ Q has its own isolated workspace (`~/.no-wing/service-accounts/{project}/`)
- ✅ Q commits with its own git identity (`Q Assistant (project)`)
- ✅ Q uses its own AWS credentials with scoped permissions
- ✅ Complete audit trail of Q vs human actions
- ✅ **No sudo required** - uses user-space isolation
- ✅ **Built with Deno** - single binary, no dependencies

## 🚀 Quick Start

### Prerequisites

- [Deno](https://deno.land/) installed
- [Amazon Q CLI](https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/cli-install.html) installed

### Installation

```bash
# Clone the repository
git clone https://github.com/pchinjr/no-wing.git
cd no-wing

# Install globally (one-time setup, requires sudo only for global command creation)
./install-deno-final.sh
```

### Basic Usage

```bash
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
