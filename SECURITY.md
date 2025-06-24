# 🔐 Security

## How Q is Secured

**Q cannot break your infrastructure.** Here's how:

### Permission Boundaries
- Q cannot create users, policies, or access keys
- Q cannot modify core no-wing infrastructure  
- Q cannot access billing, organizations, or support
- Q operations limited to your deployment region

### Resource Isolation
- Q can only create resources with `q-` prefix
- Q cannot access existing Lambda functions or roles
- Q cannot modify CloudFormation stacks
- Q has memory limits (max 1GB per Lambda)

### Session Security
- Q sessions expire after 24 hours
- All Q actions logged in CloudWatch and Git
- Every Q operation has complete audit trail
- Q identity tracked with unique agent ID

### Progressive Permissions
- Q starts as **Observer** (read-only)
- Advances to **Assistant** (configuration updates)
- Earns **Partner** status (resource creation)
- Permissions based on successful task completion

## What Q Can Do

| Level | Capabilities |
|-------|-------------|
| **Observer** | Read logs, analyze performance, generate reports |
| **Assistant** | Update Lambda configs, modify environment variables |
| **Partner** | Create Lambda functions, IAM roles, CloudWatch logs |

## What Q Cannot Do

- Create users or access keys
- Modify your existing infrastructure
- Access billing or account settings
- Escalate its own permissions
- Operate outside your AWS region
- Access other developers' Q instances

## Audit Trail

Every Q action is logged:
- **Git commits** with Q as author
- **CloudWatch logs** for all operations
- **Resource tags** showing Q attribution
- **Session tracking** with timestamps

## Compliance

no-wing follows AWS security best practices:
- ✅ Least privilege access
- ✅ Permission boundaries
- ✅ External ID authentication
- ✅ Session-based security
- ✅ Complete audit logging
- ✅ Resource isolation

**Security Score: 8.8/10** based on AWS Q Developer guidelines.
