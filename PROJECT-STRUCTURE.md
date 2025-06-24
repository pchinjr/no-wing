# 🛫 no-wing Project Structure

## Core Files

```
no-wing/
├── 📋 README.md                    # Main project documentation
├── 📦 package.json                 # Node.js dependencies and scripts
├── 🔧 tsconfig.json               # TypeScript configuration
├── 🧪 jest.config.js              # Test configuration
├── 🐳 Dockerfile                  # Container distribution
├── 📝 docker-entrypoint.sh        # Docker entry script
├── 📦 .npmignore                  # npm package exclusions
└── 🔒 .gitignore                  # Git exclusions
```

## Source Code (`src/`)

```
src/
├── cli/                           # Command-line interface
│   ├── index.ts                   # Main CLI entry point
│   ├── chat.ts                    # Interactive Q chat
│   ├── init.ts                    # Project initialization
│   ├── q-task.ts                  # One-shot Q tasks
│   ├── q-status.ts                # Q status checking
│   ├── q-history.ts               # Q task history
│   ├── verify.ts                  # Installation verification
│   └── nothing.ts                 # Easter egg command
│
├── q/                             # Q AI agent core
│   ├── identity.ts                # Q identity management
│   ├── dialogue.ts                # Q conversation system
│   ├── task-executor.ts           # Q task execution engine
│   ├── git-identity.ts            # Q Git integration
│   └── workspace-manager.ts       # Q workspace & code generation
│
├── aws/                           # AWS integration
│   ├── aws-service-manager.ts     # AWS service orchestration
│   └── sam-manager.ts             # SAM deployment management
│
├── lambda/                        # Lambda functions (no-wing core)
│   ├── index.ts                   # Main Lambda handler
│   └── orchestrator.ts            # Orchestration Lambda
│
└── __tests__/                     # Unit tests
    └── nothing.test.ts            # Test examples
```

## Q Workspace (`q-workspace/`) - Generated Code

```
q-workspace/                       # 🤖 Q-Generated Projects
├── projects/                      # Generated application code
│   ├── user-authentication/       # Example: Auth Lambda
│   │   ├── src/index.js          # Working Lambda code
│   │   ├── template.yaml         # SAM infrastructure
│   │   ├── package.json          # Node.js config
│   │   ├── tests/index.test.js   # Unit tests
│   │   └── README.md             # Project documentation
│   │
│   ├── data-pipeline/            # Example: Data processing
│   └── api-gateway/              # Example: REST API
│
├── templates/                     # Shared SAM templates
├── deployments/                   # Deployment artifacts
└── README.md                     # Workspace documentation
```

## Infrastructure (`templates/`)

```
templates/
├── q-lambda-function.yaml         # SAM template for Lambda functions
├── q-s3-bucket.yaml              # SAM template for S3 buckets
└── template-minimal.yaml         # Minimal deployment template
```

## Scripts (`scripts/`)

```
scripts/
├── cleanup-q-functions.sh         # Clean up demo functions
├── release.sh                     # Release automation
└── verify-install.sh              # Installation verification
```

## Documentation (`docs/`)

```
docs/
├── README.md                      # Documentation index
├── OVERVIEW.md                    # Project overview
├── SAM-DEPLOYMENT.md              # SAM deployment guide
├── HACKATHON-SUBMISSION.md        # Hackathon submission
└── DEPLOYMENT.md                  # Deployment instructions
```

## Distribution Files

```
├── DISTRIBUTION.md                # Distribution strategy
├── SECURITY.md                   # Security documentation
├── demo-mvp.sh                   # MVP demonstration script
├── demo-quick.sh                 # Quick demo script
└── deploy-minimal.sh             # Minimal deployment script
```

## Build Artifacts (Generated)

```
dist/                              # Compiled TypeScript (gitignored)
coverage/                          # Test coverage reports (gitignored)
.no-wing/                         # Runtime working directory (gitignored)
q-workspace/                      # Q-generated projects (gitignored)
```

## Key Features by Directory

### 🤖 **Q AI Agent (`src/q/`)**
- Identity and capability management
- Natural language task processing
- Git integration with proper attribution
- Progressive permission system
- **Workspace management for generated code**

### ☁️ **AWS Integration (`src/aws/`)**
- SAM-based Infrastructure as Code
- CloudFormation stack management
- AWS service orchestration
- Resource lifecycle management

### 💬 **CLI Interface (`src/cli/`)**
- Interactive chat with Q
- One-shot command execution
- Project initialization
- Status and history tracking

### 🏗️ **Infrastructure (`templates/`)**
- Production-ready SAM templates
- Security best practices
- Parameterized deployments
- Resource tagging and organization

### 🤖 **Q Workspace (`q-workspace/`)**
- **Separate directory for Q-generated code**
- Complete project structure per generated app
- Working Lambda functions with tests
- SAM templates for each project
- Independent deployment capability

## Code Separation Architecture

### **no-wing Source** (Version Controlled)
- CLI framework and Q agent core
- AWS integration and SAM management
- Templates and documentation
- Tests and build configuration

### **Q Workspace** (Generated, Gitignored)
- Q-created application projects
- Working code with Infrastructure as Code
- Independent deployment per project
- Professional project structure

## Development Workflow

1. **Install**: `npm install -g no-wing`
2. **Initialize**: `no-wing init --name=YourName`
3. **Chat with Q**: `no-wing chat`
4. **Q Generates Projects**: Separate workspace with complete code
5. **Deploy Projects**: `cd q-workspace/projects/my-app && sam deploy`
6. **Track Progress**: `no-wing q-status`

## Generated Project Structure

Each Q-generated project includes:

```
project-name/
├── src/                          # Application source code
├── tests/                        # Unit tests with Jest
├── docs/                         # Project documentation
├── template.yaml                 # SAM infrastructure template
├── package.json                  # Node.js configuration
└── README.md                     # Deployment instructions
```

## Distribution Channels

- **npm**: Global CLI installation
- **Docker**: Containerized execution
- **GitHub**: Template repository
- **AWS SAM**: Native deployment

---

**🛫 Clean separation: no-wing framework vs Q-generated projects!**
