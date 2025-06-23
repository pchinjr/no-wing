# 🔍 Q Verification System

## Overview

The Q Verification System ensures human oversight of all AI operations through a comprehensive human-in-the-loop workflow. Every action Q takes requires explicit human verification and approval.

## Core Principles

1. **Explicit Permission**: Q cannot perform any action without explicit human approval
2. **Audit Trail**: Every operation is logged with human approver details
3. **Small Commits**: Q makes frequent, small commits for easy review
4. **Feature Branches**: All Q work happens in isolated feature branches
5. **Progressive Trust**: Q earns more capabilities through successful operations

## Q's Current Permissions

### Level 1: Observer (Default)
```
✅ logs:CreateLogGroup, logs:CreateLogStream, logs:PutLogEvents
✅ cloudformation:DescribeStacks, cloudformation:ListStacks  
✅ lambda:GetFunction, lambda:ListFunctions
✅ s3:GetObject, s3:ListBucket
```

### Level 2: Assistant (Earned)
```
✅ All Level 1 permissions, plus:
✅ lambda:UpdateFunctionCode
✅ s3:PutObject
✅ dynamodb:GetItem, dynamodb:Query, dynamodb:PutItem
✅ cloudformation:UpdateStack
```

### Level 3: Partner (Earned)
```
✅ All Level 1 & 2 permissions, plus:
✅ lambda:CreateFunction
✅ dynamodb:CreateTable
✅ s3:CreateBucket
✅ iam:CreateRole
✅ cloudformation:CreateStack
```

## Verification Workflow

### 1. Permission Requests

When Q needs to perform an action:

```bash
# Q requests permission
🤖 Q Permission Request:
   ID: q-1703123456789-abc123def
   Action: lambda:UpdateFunctionCode
   Resource: arn:aws:lambda:us-east-1:123456789012:function:my-function
   Reason: Deploy bug fix for user authentication
   Risk: 🟡 MEDIUM

💡 This requires your approval. Use:
   no-wing approve q-1703123456789-abc123def  # to approve
   no-wing deny q-1703123456789-abc123def     # to deny
```

### 2. Human Verification

```bash
# Review and approve
no-wing verify --all                    # Show all pending items
no-wing approve q-1703123456789-abc123def  # Approve specific request
no-wing deny q-1703123456789-abc123def     # Deny specific request
```

### 3. Operation Execution

Once approved, Q executes the operation with full audit logging:

```bash
✅ Paul approved Q's request to lambda:UpdateFunctionCode on my-function
🤖 Q: Executing approved operation...
✅ Operation completed successfully in 2.3s
```

## Commit Verification Workflow

### 1. Q Makes Small Commits

Q works in feature branches with small, focused commits:

```bash
# Q creates feature branch
🤖 Q: Created feature branch 'q-feature/fix-auth-bug'
🤖 Q: Ready to make small, frequent commits!

# Q makes commits (max 5 files each)
🤖 Q: Made commit a1b2c3d4: fix authentication validation logic
🤖 Q: Files changed: src/auth.ts, src/auth.test.ts
🤖 Q: Awaiting human verification...
```

### 2. Human Reviews Commits

```bash
# Review Q's commits
no-wing verify --all                    # Show all pending commits
git log --oneline -5                    # Review recent commits
git show a1b2c3d4                      # See specific commit diff

# Verify commits
no-wing verify a1b2c3d4 b2c3d4e5       # Verify specific commits
no-wing verify --all                    # Verify all pending
```

### 3. Create Pull Request

Once all commits are verified:

```bash
✅ All commits verified by Paul
🚀 All commits verified! Ready to create pull request.
💡 Use: no-wing create-pr

🤖 Q: Created pull request for branch 'q-feature/fix-auth-bug'
🤖 Q: All 3 commits have been human-verified
🤖 Q: Ready for code review!
```

## Risk Assessment

Q automatically assesses risk levels for all operations:

### 🟢 Low Risk
- Read operations
- Log creation
- Development environment changes
- Configuration updates

### 🟡 Medium Risk  
- Code deployments
- Database modifications
- Stack updates
- File uploads

### 🔴 High Risk
- Resource creation/deletion
- IAM changes
- Production operations
- Security modifications

**High risk operations always require explicit human approval regardless of Q's capability level.**

## Audit Trail

Every Q operation creates a comprehensive audit trail:

```json
{
  "requestId": "q-1703123456789-abc123def",
  "action": "lambda:UpdateFunctionCode", 
  "resource": "arn:aws:lambda:us-east-1:123456789012:function:my-function",
  "status": "completed",
  "humanApprover": "Paul",
  "timestamp": "2024-12-21T10:30:00Z",
  "duration": 2300,
  "riskLevel": "medium"
}
```

## Commands Reference

### Verification Commands
```bash
no-wing verify                          # Interactive verification menu
no-wing verify --all                    # Show all pending items
no-wing verify --request <id>           # Verify permission request
no-wing verify --commit <hash>          # Verify specific commit
no-wing verify <hash1> <hash2>          # Verify multiple commits

no-wing approve <requestId>             # Approve permission request
no-wing deny <requestId>                # Deny permission request
```

### Monitoring Commands
```bash
no-wing status                          # Q's current status
no-wing metrics                         # Q's performance metrics
no-wing history                         # Q's operation history
no-wing audit                           # Full audit trail
```

## Security Safeguards

### Built-in Protections
- ✅ Q cannot escalate its own permissions
- ✅ Q cannot access other Q instances
- ✅ Q cannot modify security policies without approval
- ✅ All operations have resource quotas and limits
- ✅ Automatic rollback on security violations
- ✅ Production access requires explicit approval

### Rollback Triggers
- Security violation detected
- Error rate exceeds threshold (>5%)
- Developer revokes permissions
- Anomalous behavior detected
- Failed operations on critical resources

## Best Practices

### For Humans
1. **Review Every Request**: Don't auto-approve, understand what Q is doing
2. **Check Diffs**: Always review commit diffs before verification
3. **Monitor Metrics**: Keep an eye on Q's success rate and error patterns
4. **Start Small**: Begin with low-risk operations, build trust gradually
5. **Document Decisions**: Add comments when approving/denying requests

### For Q
1. **Small Commits**: Maximum 5 files per commit
2. **Clear Messages**: Descriptive commit messages and request reasons
3. **Feature Branches**: Always work in isolated branches
4. **Test First**: Run tests before requesting deployment approval
5. **Document Changes**: Include comments and documentation updates

## Troubleshooting

### Common Issues

**Q requests keep getting denied**
- Check if Q is operating within its capability level
- Verify the risk assessment is appropriate
- Ensure proper justification in request reason

**Commits not being verified**
- Check if commits are too large (>5 files)
- Ensure commits are in a feature branch
- Verify commit messages follow conventions

**Operations failing after approval**
- Check AWS permissions and quotas
- Verify network connectivity
- Review error logs in audit trail

### Getting Help

```bash
no-wing verify --help                   # Verification command help
no-wing status                          # Current Q status
no-wing audit --recent                  # Recent operation logs
```

---

**Remember: Q is your AI teammate, not just a tool. The verification system ensures safe collaboration while building trust over time.**
