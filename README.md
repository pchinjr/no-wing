# 🛫 no-wing

**Guardian Angel for Amazon Q - Project-aware AI assistant for AWS serverless developers**

Configure and launch Amazon Q with your AWS serverless project context. Q will understand your project structure, AWS account, and commit authorship - so you never need to start Q directly.

## 🎯 Purpose

**no-wing** acts as a guardian angel for Q, providing:
- **Project Context**: Q understands your SAM/CDK/Serverless project structure
- **AWS Account Awareness**: Q knows your AWS account and region settings
- **Commit Authorship**: Q commits changes with proper git authorship
- **SAM Integration**: Q can deploy using your SAM configuration
- **Zero Direct Q Access**: You only interact with no-wing, never Q directly

## 🚀 Quick Start

```bash
# Navigate to your AWS serverless project
cd my-sam-project

# Configure and launch Q with project context
no-wing setup

# Q launches with full understanding of your project!
```

## 📋 Commands

### Essential Commands
```bash
no-wing setup              # Configure and launch Q (recommended)
no-wing configure          # Configure Q with project context
no-wing launch             # Launch Q with guidance
no-wing status             # Show project and Q status
```

### What Q Will Know About Your Project
- **Project Type**: SAM, CDK, Serverless Framework, or generic
- **AWS Context**: Your account ID and region
- **Git Repository**: Branch, remote, and commit authorship
- **Lambda Functions**: Existing functions and project structure
- **SAM Configuration**: Template location and deployment settings

## 🛡️ Guardian Features

### Project-Aware Q Responses
Q understands your specific project and provides contextual help:
- Creates Lambda functions that fit your project structure
- Uses your AWS account and region for deployments
- Follows your existing naming conventions and patterns

### Proper Commit Authorship
When Q makes changes to your code:
- Commits are authored with your git credentials
- Commit messages include `[Q]` prefix for tracking
- Maintains proper git history and attribution

### SAM Deployment Integration
Q can deploy your serverless applications:
- Uses your configured AWS account and region
- Applies proper IAM capabilities and tags
- Follows your existing SAM configuration

## 💡 Example Workflow

```bash
# 1. Navigate to your SAM project
cd my-serverless-api

# 2. Set up Q Guardian
no-wing setup

# 3. Q launches with project context
# Q now knows:
# - This is a SAM project
# - Your AWS account: 123456789012
# - Your region: us-east-1
# - Your git author: John Doe <john@example.com>
# - Your existing Lambda functions

# 4. Ask Q to help with your project
Q: "create a new Lambda function for user authentication"
# Q creates function, updates SAM template, commits with your authorship

Q: "deploy this project"
# Q runs: sam deploy with your AWS settings

Q: "what Lambda functions do I have?"
# Q lists your existing functions from the SAM template
```

## 🔧 Installation

```bash
npm install -g no-wing
```

## 📊 Project Analysis

**no-wing** automatically detects:
- **SAM Projects**: `template.yaml` or `template.yml`
- **CDK Projects**: `cdk.json`
- **Serverless Framework**: `serverless.yml`
- **Git Repository**: Branch, remote, author information
- **AWS Context**: Account ID and region from your credentials
- **Lambda Functions**: Existing functions in your templates

## 🎯 Benefits

### For AWS Serverless Developers
- **Faster Development**: Q understands your project immediately
- **Consistent Deployments**: Uses your AWS settings automatically
- **Proper Git History**: Q commits with your authorship
- **Context-Aware Help**: Q provides relevant suggestions for your project

### For Teams
- **Standardized Q Usage**: Everyone uses the same project-aware Q
- **Audit Trail**: All Q changes are properly attributed
- **Project Consistency**: Q follows existing patterns and conventions

## 🛠️ Requirements

- Node.js 18+
- AWS CLI configured with credentials
- Git repository (recommended for full features)
- SAM CLI (for SAM project deployments)

---

**🛫 no-wing: Your Guardian Angel for Amazon Q**

*Never start Q directly again. Let no-wing configure Q with your project context and AWS settings.*
