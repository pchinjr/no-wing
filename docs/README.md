# no-wing Documentation

Complete documentation for the no-wing Q Service Account Manager.

## 📚 Documentation Index

### Getting Started
- **[Quick Start Guide](../README.md#quick-start)** - Installation and basic usage
- **[Installation Guide](#installation)** - Detailed installation instructions
- **[First Steps](#first-steps)** - Your first service account setup

### Core Concepts
- **[Service Account Architecture](#service-account-architecture)** - How no-wing works
- **[Identity Separation](#identity-separation)** - Git and AWS isolation
- **[Project Detection](#project-detection)** - SAM, CDK, and generic projects
- **[Workspace Management](#workspace-management)** - Understanding workspaces

### User Guides
- **[Command Reference](#command-reference)** - All available commands
- **[AWS Integration](#aws-integration)** - Setting up AWS credentials
- **[Git Configuration](#git-configuration)** - Understanding git identity
- **[Troubleshooting](#troubleshooting)** - Common issues and solutions

### Technical Documentation
- **[Deno Migration Guide](DENO_MIGRATION.md)** - Migration from Node.js to Deno
- **[Architecture Overview](#architecture-overview)** - Technical implementation
- **[Security Model](#security-model)** - Security considerations
- **[Contributing Guide](CONTRIBUTING.md)** - How to contribute

## Installation

### Prerequisites

1. **Deno Runtime**
   ```bash
   # Install Deno
   curl -fsSL https://deno.land/x/install/install.sh | sh
   
   # Add to PATH
   echo 'export PATH="$HOME/.deno/bin:$PATH"' >> ~/.bashrc
   source ~/.bashrc
   
   # Verify installation
   deno --version
   ```

2. **Amazon Q CLI** (Optional - for launching Q)
   ```bash
   # Follow AWS documentation
   # https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/cli-install.html
   ```

### Global Installation

```bash
# Clone the repository
git clone https://github.com/pchinjr/no-wing.git
cd no-wing

# Install globally (requires sudo only for global command creation)
./install-deno-final.sh
```

### Verification

```bash
# Test installation
no-wing --version
no-wing --help

# Test in a project
cd your-project
no-wing setup --force
no-wing status
```

## First Steps

### 1. Set Up Your First Service Account

```bash
cd your-project
no-wing setup
```

This creates:
- Isolated workspace in `~/.no-wing/service-accounts/your-project/`
- Git identity: `Q Assistant (your-project)`
- AWS profile: `q-assistant-your-project`
- Launch scripts and configuration

### 2. Check Status

```bash
no-wing status
```

Verify all components are properly configured.

### 3. Configure AWS (Optional)

```bash
no-wing aws-setup
```

Enter your AWS credentials for Q to use.

### 4. Launch Q

```bash
no-wing launch
```

Q will run with its own identity, separate from yours.

## Service Account Architecture

### Workspace Structure

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

### Environment Isolation

When Q runs, it uses isolated environment variables:

```bash
export GIT_CONFIG_GLOBAL="~/.no-wing/service-accounts/project/.gitconfig"
export AWS_CONFIG_FILE="~/.no-wing/service-accounts/project/.aws/config"
export AWS_SHARED_CREDENTIALS_FILE="~/.no-wing/service-accounts/project/.aws/credentials"
export AWS_PROFILE="q-assistant-project"
```

## Identity Separation

### Git Identity

Each project gets its own git identity:
- **Name**: `Q Assistant (project-name)`
- **Email**: `q-assistant+project-name@no-wing.dev`
- **Configuration**: Isolated `.gitconfig` file

### AWS Identity

Each project gets its own AWS profile:
- **Profile Name**: `q-assistant-project-name`
- **Credentials**: Isolated credentials file
- **Permissions**: Project-specific (SAM, CDK, or generic)

## Project Detection

no-wing automatically detects your project type:

### SAM Projects
- **Detection**: `template.yaml` or `template.yml`
- **AWS Permissions**: Lambda, API Gateway, CloudFormation, S3, IAM
- **Deploy Command**: `sam deploy`

### CDK Projects
- **Detection**: `cdk.json`
- **AWS Permissions**: CloudFormation, CDK, S3, IAM, EC2, Lambda
- **Deploy Command**: `cdk deploy`

### Generic Projects
- **Detection**: Fallback for any project
- **AWS Permissions**: Basic AWS services (S3, Lambda, CloudFormation)
- **Deploy Command**: `aws cloudformation deploy`

## Command Reference

### Setup Commands

```bash
# Create service account for current project
no-wing setup

# Force recreate existing service account
no-wing setup --force
```

### Management Commands

```bash
# Check service account status
no-wing status

# Launch Q with service account identity
no-wing launch                    # Start chat session
no-wing launch help               # Show Q CLI help
no-wing launch --verbose          # Launch with verbose output

# Configure AWS credentials
no-wing aws-setup

# Remove service account
no-wing cleanup                   # Interactive cleanup
no-wing cleanup --force           # Force removal
```

### Information Commands

```bash
# Show version
no-wing --version

# Show help
no-wing --help

# Show command-specific help
no-wing launch --help
```

## AWS Integration

### Setting Up AWS Credentials

1. **Run AWS Setup**
   ```bash
   no-wing aws-setup
   ```

2. **Enter Credentials**
   - AWS Access Key ID
   - AWS Secret Access Key

3. **Verify Configuration**
   ```bash
   no-wing status
   ```

### AWS Profile Management

Each project gets its own AWS profile:
- **Profile Name**: `q-assistant-{project}`
- **Location**: `~/.no-wing/service-accounts/{project}/.aws/`
- **Isolation**: Completely separate from your personal AWS credentials

### Permissions

AWS permissions are automatically configured based on project type:
- **SAM**: Lambda, API Gateway, CloudFormation, S3, IAM
- **CDK**: CloudFormation, CDK, S3, IAM, EC2, Lambda
- **Generic**: S3, Lambda, CloudFormation

## Git Configuration

### Automatic Configuration

Each service account gets its own git identity:

```ini
[user]
    name = Q Assistant (project-name)
    email = q-assistant+project-name@no-wing.dev
[core]
    editor = nano
[init]
    defaultBranch = main
[credential]
    helper = store
```

### Commit Attribution

All Q commits will be clearly attributed:
- **Author**: `Q Assistant (project-name)`
- **Email**: `q-assistant+project-name@no-wing.dev`
- **Separate from your commits**: Clear audit trail

## Workspace Management

### Workspace Location

All service accounts are stored in:
```
~/.no-wing/service-accounts/
├── project-1/
├── project-2/
└── project-3/
```

### Per-Project Isolation

Each project workspace contains:
- **Git configuration**: Isolated git identity
- **AWS credentials**: Separate AWS profile
- **Launch scripts**: Project-specific launch configuration
- **Logs**: Audit trail of Q sessions
- **Working directory**: Q's workspace for the project

### Cleanup

Remove individual projects:
```bash
cd project-directory
no-wing cleanup
```

Remove all service accounts:
```bash
rm -rf ~/.no-wing/service-accounts/
```

## Architecture Overview

### High-Level Architecture

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

### Key Components

1. **ProjectDetector**: Identifies project type (SAM, CDK, Generic)
2. **ServiceAccountManager**: Manages workspace creation and configuration
3. **Environment Isolation**: Sets up isolated environment variables
4. **Launch Scripts**: Execute Q with proper identity

## Security Model

### Isolation Principles

1. **User-Space Isolation**: No system user creation required
2. **Environment Separation**: Isolated git and AWS configurations
3. **Workspace Boundaries**: Clear separation between projects
4. **Audit Trail**: Complete logging of Q activities

### Security Benefits

- **No sudo required**: Eliminates privilege escalation risks
- **Identity separation**: Clear attribution of Q vs human actions
- **Credential isolation**: Q uses separate AWS credentials
- **Workspace isolation**: Q operates in isolated directories

### Best Practices

1. **Use dedicated AWS credentials** for Q service accounts
2. **Review Q's actions** through git history and logs
3. **Limit AWS permissions** to minimum required for project
4. **Regular cleanup** of unused service accounts

## Troubleshooting

### Common Issues

#### Deno Not Found
```bash
# Install Deno
curl -fsSL https://deno.land/x/install/install.sh | sh

# Add to PATH
echo 'export PATH="$HOME/.deno/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

#### Q CLI Not Found
```bash
# Check Q CLI installation
which q

# Install Q CLI (follow AWS documentation)
# https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/cli-install.html
```

#### Service Account Issues
```bash
# Check status
no-wing status

# Recreate service account
no-wing cleanup --force && no-wing setup

# Check workspace
ls -la ~/.no-wing/service-accounts/
```

#### Permission Issues
```bash
# Check file permissions
ls -la ~/.no-wing/service-accounts/{project}/

# Recreate with force
no-wing setup --force
```

### Debug Mode

Run commands with verbose output:
```bash
# Enable debug logging
export NO_WING_DEBUG=1

# Run commands
no-wing setup
no-wing launch --verbose
```

### Getting Help

1. **Check documentation**: This guide and README
2. **Review logs**: `~/.no-wing/service-accounts/{project}/logs/`
3. **File issues**: [GitHub Issues](https://github.com/pchinjr/no-wing/issues)
4. **Community support**: GitHub Discussions

## Performance

### Startup Time
- **Deno**: ~200-500ms (direct execution)
- **No build step**: Immediate execution
- **Fast project detection**: Minimal file system operations

### Memory Usage
- **Runtime**: ~20-30MB (minimal Deno runtime)
- **No dependencies**: No node_modules overhead
- **Efficient**: Single TypeScript file execution

### Disk Usage
- **Core**: ~2MB (single TypeScript file)
- **Per project**: ~1-5MB (workspace + logs)
- **Dependencies**: Cached by Deno automatically

## Migration from Node.js

See the detailed [Deno Migration Guide](DENO_MIGRATION.md) for:
- Migration rationale
- Architectural changes
- Performance improvements
- Breaking changes
- Migration steps

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for:
- Development setup
- Code style guidelines
- Testing requirements
- Pull request process
- Release procedures
