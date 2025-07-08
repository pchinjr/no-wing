# 🎯 no-wing MVP Roadmap

**Goal**: Create a working Q service account manager that gives Amazon Q its own identity per project.

## 🏆 MVP Success Criteria

1. ✅ **Q has its own local user account** per project
2. ✅ **Q commits with its own git identity** (not user's identity)
3. ✅ **Q uses its own AWS credentials** with scoped permissions
4. ✅ **Clear audit trail** of Q vs human actions
5. ✅ **Easy setup/teardown** of Q service account per project

## 📋 Phase 1: Core Infrastructure (Week 1)

### P0 - Critical Path
- [ ] **Local User Management**
  - [ ] Create dedicated user account per project (`q-assistant-{project}`)
  - [ ] Set up user home directory and workspace
  - [ ] Configure sudo permissions for Q user
  - [ ] Test: Q can execute commands as its own user

- [ ] **Git Identity Setup**
  - [ ] Configure Q's git identity per project
  - [ ] Generate SSH keys for Q user
  - [ ] Test: Q can commit with proper attribution
  - [ ] Test: Q commits show "[Q]" prefix and correct author

### P1 - Important
- [ ] **Project Detection**
  - [ ] Detect SAM projects (`template.yaml`)
  - [ ] Detect CDK projects (`cdk.json`) 
  - [ ] Detect Serverless Framework (`serverless.yml`)
  - [ ] Generate project-specific Q username

- [ ] **Basic CLI Structure**
  - [ ] `no-wing setup` command
  - [ ] `no-wing status` command
  - [ ] `no-wing cleanup` command
  - [ ] Error handling and user feedback

## 📋 Phase 2: AWS Integration (Week 2)

### P0 - Critical Path
- [ ] **AWS Identity Management**
  - [ ] Create IAM user for Q per project
  - [ ] Generate access keys for Q user
  - [ ] Configure AWS profile for Q user
  - [ ] Test: Q can make AWS API calls with own credentials

- [ ] **Permission Scoping**
  - [ ] Define minimal permission sets by project type
  - [ ] SAM project permissions (Lambda, API Gateway, CloudFormation)
  - [ ] CDK project permissions (CDK-specific resources)
  - [ ] Apply least-privilege principle

### P1 - Important
- [ ] **AWS CLI Integration**
  - [ ] Q uses its own AWS profile for all operations
  - [ ] Test: `aws sts get-caller-identity` shows Q's identity
  - [ ] Test: Q can deploy SAM/CDK projects

## 📋 Phase 3: Q Integration (Week 3)

### P0 - Critical Path
- [ ] **Q Launch with Service Account**
  - [ ] Launch Q process as Q user (not current user)
  - [ ] Pass project context to Q
  - [ ] Ensure Q uses its own credentials and identity
  - [ ] Test: Q operates entirely as service account

- [ ] **Command Execution**
  - [ ] Q executes all commands as its own user
  - [ ] Q commits use proper git identity
  - [ ] Q AWS operations use its own credentials
  - [ ] Test: Full workflow from Q suggestion to deployment

### P1 - Important
- [ ] **Audit and Monitoring**
  - [ ] Log all Q actions with timestamps
  - [ ] Track Q's git commits separately
  - [ ] Monitor Q's AWS API usage
  - [ ] `no-wing audit` command to show Q activity

## 📋 Phase 4: Polish & Safety (Week 4)

### P0 - Critical Path
- [ ] **Safety Features**
  - [ ] Emergency stop functionality
  - [ ] Q permission revocation
  - [ ] Workspace cleanup on errors
  - [ ] Rollback Q actions if needed

- [ ] **User Experience**
  - [ ] Clear setup instructions and prompts
  - [ ] Status indicators for Q service account health
  - [ ] Helpful error messages and troubleshooting
  - [ ] Documentation with examples

### P1 - Important
- [ ] **Testing & Validation**
  - [ ] End-to-end testing scenarios
  - [ ] Security validation (Q can't access user files)
  - [ ] Permission validation (Q has minimal required access)
  - [ ] Cross-platform testing (Linux/macOS)

## 🧪 Testing Scenarios

### Core Functionality Tests
1. **Setup Test**: `no-wing setup` creates Q service account successfully
2. **Identity Test**: Q commits show proper attribution (not user's name)
3. **AWS Test**: Q deploys using its own AWS credentials
4. **Isolation Test**: Q cannot access user's files outside workspace
5. **Cleanup Test**: `no-wing cleanup` removes all Q artifacts

### Security Tests
1. **Permission Test**: Q cannot escalate its own permissions
2. **Isolation Test**: Q user cannot access other users' data
3. **Credential Test**: Q's AWS keys are separate from user's keys
4. **Audit Test**: All Q actions are properly logged and attributed

### Integration Tests
1. **SAM Test**: Q can deploy SAM application with its own identity
2. **Git Test**: Q can commit, push, and create PRs with proper attribution
3. **Multi-Project Test**: Different projects have isolated Q identities

## 🎯 MVP Definition of Done

- [ ] Developer runs `no-wing setup` in a SAM project
- [ ] Q service account is created with proper identity
- [ ] Q can commit code with its own git identity
- [ ] Q can deploy AWS resources with its own credentials
- [ ] All Q actions are clearly attributed and auditable
- [ ] Developer can run `no-wing cleanup` to remove Q service account
- [ ] Documentation covers setup, usage, and troubleshooting

## 🚀 Post-MVP Features

- Global Q setup option
- Cross-project Q intelligence
- Advanced permission management
- Q identity federation
- Team Q management
- Q action approval workflows

---

**Target: 4-week MVP with core Q service account functionality**
