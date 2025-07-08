# 🛫 no-wing

**Q Service Account Manager - Give Amazon Q its own identity for secure, auditable project automation**

Configure Amazon Q with its own local user account, AWS credentials, and git identity per project. Q operates as a dedicated service account with proper attribution and isolated permissions - never masquerading as you again.

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
- ✅ Clear separation between human and AI actions
- ✅ Isolated blast radius per project
- ✅ Complete audit trail of all Q operations

## 🚀 Quick Start

```bash
# Navigate to your AWS serverless project
cd my-sam-project

# Set up Q as a service account for this project
no-wing setup

# Launch Q with its own identity
no-wing launch

# Q now operates with complete identity separation!
# - Local user: q-assistant-my-sam-project
# - Git commits: "Q Assistant (my-sam-project) <q-assistant+my-sam-project@no-wing.dev>"
# - AWS profile: q-assistant-my-sam-project
# - Isolated workspace with project copy
```

## 📋 Core Commands

```bash
no-wing setup              # Create Q service account for current project
no-wing status             # Show Q service account health and status
no-wing launch             # Launch Q with service account identity
no-wing audit              # Show Q's session history and activity
no-wing cleanup            # Remove Q service account and resources
no-wing help               # Show detailed help and usage examples
```

### Command Options

```bash
# Setup options
no-wing setup --dry-run    # Show what would be created without making changes
no-wing setup --force      # Recreate existing service account
no-wing setup --skip-aws   # Create local-only account (no AWS integration)

# Status options  
no-wing status --verbose   # Show detailed configuration and permissions
no-wing status --skip-aws-check  # Skip AWS validation (faster)

# Audit options
no-wing audit --lines 10   # Show last 10 log entries
no-wing audit --verbose    # Show detailed session information
no-wing audit --session-id <id>  # Filter by specific session

# Launch options
no-wing launch --background  # Launch without interactive prompts
no-wing launch --verbose    # Show detailed technical information
```

## 🏗️ What no-wing Creates

### Complete Q Identity Stack

```
🧑 Human User                    🤖 Q Assistant
├── Local user: your-username    ├── Local user: q-assistant-{project}
├── Git identity: Your Name      ├── Git identity: "Q Assistant ({project})"
├── AWS profile: your-profile    ├── AWS profile: q-assistant-{project}
└── Workspace: your-directory    └── Workspace: /home/q-assistant-{project}/workspace
```

### Local Service Account
```
q-assistant-{project}/
├── Home: /home/q-assistant-{project}/
├── Shell: /bin/bash with Q environment
├── Workspace: /home/q-assistant-{project}/workspace/
├── Sessions: /home/q-assistant-{project}/workspace/sessions/
└── Logs: /home/q-assistant-{project}/.no-wing/logs/
```

### AWS Identity
```
AWS Profile: q-assistant-{project}
├── IAM User: q-assistant-{project} (tagged with no-wing metadata)
├── Access Keys: Dedicated to this project
├── Policies: Project-specific permissions (SAM/CDK/Serverless/Generic)
├── Path: /no-wing/ (organized IAM structure)
└── Region: Configurable (default: us-east-1)
```

### Git Identity
```
Git Config:
├── Name: "Q Assistant ({project})"
├── Email: "q-assistant+{project}@no-wing.dev"
├── Default Branch: main
├── Editor: nano
└── Commit Attribution: Always shows Q, never human
```

## 🔐 Security Model

### Bootstrap Approach
```bash
# Your credentials used ONLY for Q identity creation
export AWS_PROFILE=your-admin-profile
no-wing setup  # Creates Q's IAM user with your credentials

# Q uses its OWN credentials for all operations
no-wing launch  # Q operates independently with q-assistant-{project} profile
```

### Least Privilege by Project Type
- **SAM Projects**: CloudFormation, Lambda, API Gateway, S3 + IAM role management
- **CDK Projects**: PowerUser access + additional IAM permissions for CDK operations
- **Serverless Framework**: Lambda, API Gateway, CloudFormation + Events/Scheduler
- **Generic Projects**: ReadOnly access + basic deployment permissions

### Complete Audit Trail
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "event": "session_start",
  "sessionId": "q-abc123-def456",
  "user": "q-assistant-my-project",
  "project": "my-project",
  "gitIdentity": {
    "name": "Q Assistant (my-project)",
    "email": "q-assistant+my-project@no-wing.dev"
  },
  "awsProfile": "q-assistant-my-project"
}
```

### Blast Radius Containment
- Q compromise only affects current project
- No cross-project credential sharing
- Easy to revoke/recreate Q identity per project
- Isolated workspaces prevent cross-contamination

## 📊 Smart Project Detection

**no-wing** automatically detects project type and configures appropriate permissions:

| Project Type | Detection | Deploy Command | Key Permissions |
|--------------|-----------|----------------|-----------------|
| **SAM** | `template.yaml` | `sam deploy` | Lambda, API Gateway, CloudFormation, S3 |
| **CDK** | `cdk.json` | `cdk deploy` | PowerUser + IAM for CDK operations |
| **Serverless** | `serverless.yml` | `serverless deploy` | Lambda, API Gateway, Events, CloudFormation |
| **Generic** | Fallback | `aws cloudformation deploy` | ReadOnly + basic deployment |

## 🔐 AWS Credential Handling

### Clear Communication
When AWS credentials are needed, no-wing explains exactly why:

```
🔐 AWS Credentials Required

no-wing needs AWS credentials to:
  • Create IAM user for Q service account
  • Generate access keys for Q
  • Attach appropriate policies to Q
  • Set up AWS profile: q-assistant-my-project

🛡️  Security Notes:
  • Your credentials are only used for this operation
  • Q will get its own separate AWS credentials
  • Q will never use your personal credentials
  • All Q actions will be clearly attributed to Q
```

### Credential Resolution Order
1. Environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
2. AWS profile (`AWS_PROFILE` or `--profile`)
3. IAM role (if running on EC2/Lambda)
4. Default profile (`~/.aws/credentials`)

## 🎬 Complete User Journey

### 1. Project Setup
```bash
cd my-sam-project
no-wing setup
# ✅ Creates q-assistant-my-sam-project user
# ✅ Sets up git identity: "Q Assistant (my-sam-project)"
# ✅ Creates AWS IAM user with SAM permissions
# ✅ Configures isolated workspace
```

### 2. Q Launch
```bash
no-wing launch
# ✅ Validates service account health
# ✅ Shows Q identity summary
# ✅ Launches Q in isolated environment
# ✅ Q operates with complete identity separation
```

### 3. Monitoring & Audit
```bash
no-wing status    # Check Q service account health
no-wing audit     # View all Q session activity
# ✅ Complete transparency of Q operations
# ✅ Session tracking and statistics
# ✅ Clear attribution of all Q actions
```

## 🧪 Testing

```bash
npm test                    # Run all tests
npm run test:tape          # Run tape tests specifically
npm run build              # Build TypeScript

# Current test coverage: 118 tests passing
# - Project detection and configuration
# - Service account management
# - AWS identity management
# - Q session management
# - Credential handling
# - Audit logging
```

## 🛠️ Requirements

- **Node.js 18+** - For running no-wing CLI
- **sudo access** - For creating local user accounts
- **AWS CLI configured** - With admin permissions for initial Q setup
- **Git repository** - For Q git identity setup (optional but recommended)

## 📦 Installation

```bash
# Clone and build (npm package coming soon)
git clone https://github.com/pchinjr/no-wing.git
cd no-wing
npm install
npm run build

# Make CLI available globally
npm link

# Or run directly
node dist/cli/index.js --help
```

## 🎯 Status: Production Ready

**✅ Complete Implementation**
- ✅ **Phase 1**: Local user management & git identity
- ✅ **Phase 2**: AWS integration with IAM users & policies  
- ✅ **Phase 3**: Q session management & identity isolation
- ✅ **Credential Handling**: Clear AWS credential prompting
- ✅ **118 tests passing**: Production-ready reliability

**🛫 Mission Accomplished**: Q now operates with its own identity - never masquerading as human again!

## 🤝 Contributing

We welcome contributions! Please see our development approach:
- Small, focused commits with clear purposes
- Comprehensive test coverage for all features
- Clear documentation and user communication
- Security-first design principles

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

---

**🛫 no-wing: Q Service Account Manager**

*Give Amazon Q its own identity. Secure, auditable, isolated.*

**The chicken-and-egg problem is solved. Q has its own wings!**
