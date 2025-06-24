# no-wing Responsibility Matrix

## 🎯 **Who Does What: AWS Admin vs Q**

This matrix clearly defines responsibilities between AWS Account Administrators and Q agents to ensure security, compliance, and proper separation of duties.

---

## 🔐 **AWS ACCOUNT ADMIN RESPONSIBILITIES**

### **Security & Governance** (Cannot be delegated)

| Task | Why Admin Only | Risk Level |
|------|----------------|------------|
| Create root IAM roles | Root privilege escalation risk | 🔴 Critical |
| Set permission boundaries | Prevents Q privilege escalation | 🔴 Critical |
| Configure CloudTrail | Audit integrity | 🔴 Critical |
| Set up billing alerts | Cost control | 🟡 High |
| Create GitHub App | Organization-level access | 🟡 High |
| Deploy orchestrator Lambda | Master control plane | 🔴 Critical |

### **Compliance & Audit**

| Task | Why Admin Only | Risk Level |
|------|----------------|------------|
| Enable CloudTrail logging | Legal/compliance requirements | 🔴 Critical |
| Set data retention policies | Regulatory compliance | 🟡 High |
| Configure backup strategies | Business continuity | 🟡 High |
| Set up disaster recovery | Business continuity | 🟡 High |

### **Cost & Resource Management**

| Task | Why Admin Only | Risk Level |
|------|----------------|------------|
| Set spending limits | Financial control | 🔴 Critical |
| Configure service quotas | Resource abuse prevention | 🟡 High |
| Set up cost allocation tags | Financial tracking | 🟢 Medium |

---

## 🤖 **Q AGENT RESPONSIBILITIES**

### **Developer Onboarding** (Fully automated)

| Task | Q Capability Level | Automation Level |
|------|-------------------|------------------|
| Create developer IAM roles | Assistant+ | 🟢 Full |
| Generate AWS credentials | Assistant+ | 🟢 Full |
| Configure local AWS CLI | Observer+ | 🟢 Full |
| Set up GitHub Actions | Assistant+ | 🟢 Full |
| Create project repositories | Partner+ | 🟢 Full |

### **Infrastructure Management**

| Task | Q Capability Level | Automation Level |
|------|-------------------|------------------|
| Deploy Lambda functions | Assistant+ | 🟢 Full |
| Create S3 buckets | Assistant+ | 🟢 Full |
| Set up API Gateway | Partner+ | 🟢 Full |
| Configure DynamoDB | Partner+ | 🟢 Full |
| Manage CloudWatch alarms | Assistant+ | 🟢 Full |

### **Application Deployment**

| Task | Q Capability Level | Automation Level |
|------|-------------------|------------------|
| Deploy application code | Assistant+ | 🟢 Full |
| Manage environment variables | Assistant+ | 🟢 Full |
| Handle blue/green deployments | Partner+ | 🟢 Full |
| Update function configurations | Assistant+ | 🟢 Full |
| Coordinate multi-service updates | Partner+ | 🟢 Full |

### **Monitoring & Maintenance**

| Task | Q Capability Level | Automation Level |
|------|-------------------|------------------|
| Create custom metrics | Assistant+ | 🟢 Full |
| Generate performance reports | Observer+ | 🟢 Full |
| Optimize resource configurations | Partner+ | 🟢 Full |
| Handle routine maintenance | Assistant+ | 🟢 Full |
| Troubleshoot application issues | Observer+ | 🟢 Full |

---

## 🤝 **SHARED RESPONSIBILITIES**

### **Security Monitoring**

| Task | Admin Role | Q Role | Collaboration |
|------|------------|--------|---------------|
| Security incident response | Define policies | Execute remediation | Admin sets rules, Q implements |
| Access review | Approve changes | Generate reports | Q reports, Admin approves |
| Vulnerability management | Set standards | Scan and patch | Q identifies, Admin approves fixes |

### **Cost Optimization**

| Task | Admin Role | Q Role | Collaboration |
|------|------------|--------|---------------|
| Resource rightsizing | Set budgets | Optimize usage | Q recommends, Admin approves |
| Unused resource cleanup | Define policies | Execute cleanup | Q identifies, Admin confirms |
| Cost reporting | Review reports | Generate insights | Q analyzes, Admin acts |

---

## 📊 **CAPABILITY PROGRESSION**

### **Q Observer Level** (Read-only)
```
✅ Can Do:
- Read AWS resource configurations
- Analyze CloudWatch logs and metrics
- Generate reports and insights
- Monitor application performance
- Identify optimization opportunities

❌ Cannot Do:
- Modify any AWS resources
- Create new resources
- Change configurations
- Access sensitive data
- Make financial decisions
```

### **Q Assistant Level** (Modify existing)
```
✅ Can Do:
- Update Lambda function configurations
- Modify S3 bucket policies
- Adjust CloudWatch alarms
- Deploy application code
- Manage environment variables

❌ Cannot Do:
- Create new AWS services
- Modify IAM roles/policies
- Delete critical resources
- Access billing information
- Change security settings
```

### **Q Partner Level** (Create new)
```
✅ Can Do:
- Create new Lambda functions
- Set up new S3 buckets
- Deploy new API Gateway endpoints
- Create DynamoDB tables
- Design system architectures

❌ Cannot Do:
- Modify permission boundaries
- Access other Q instances
- Change audit settings
- Escalate own privileges
- Override admin policies
```

---

## 🚨 **EMERGENCY PROCEDURES**

### **If Q Goes Rogue**

| Step | Admin Action | Timeline |
|------|--------------|----------|
| 1. Immediate Stop | Revoke orchestrator role permissions | < 5 minutes |
| 2. Assess Damage | Review CloudTrail logs for Q actions | < 30 minutes |
| 3. Rollback | Use Git history to identify changes | < 1 hour |
| 4. Investigate | Analyze Q decision patterns | < 24 hours |
| 5. Remediate | Fix any security or cost issues | < 48 hours |

### **Cost Overrun Response**

| Threshold | Auto Action | Admin Action |
|-----------|-------------|--------------|
| 80% of budget | Q sends alert | Review Q activities |
| 100% of budget | Q stops new resources | Investigate and approve/deny |
| 120% of budget | Q role suspended | Emergency cost review |

---

## 📋 **SETUP VALIDATION CHECKLIST**

### **Admin Setup Verification**
- [ ] Orchestrator role can assume Q base role
- [ ] Permission boundaries prevent privilege escalation
- [ ] CloudTrail captures all Q actions
- [ ] Cost alerts trigger at defined thresholds
- [ ] GitHub integration works end-to-end
- [ ] Emergency stop procedures tested

### **Q Capability Verification**
- [ ] Observer Q can read but not modify
- [ ] Assistant Q can modify but not create
- [ ] Partner Q can create within boundaries
- [ ] Q cannot access other Q instances
- [ ] Q cannot modify its own permissions
- [ ] Q properly attributes Git commits

---

## 🎯 **SUCCESS METRICS**

### **Admin Efficiency**
- **Before no-wing**: 2-3 days to onboard a developer
- **After no-wing**: 15 minutes automated onboarding

### **Security Posture**
- **100%** of Q actions audited in CloudTrail
- **0** privilege escalation incidents
- **< 5 minutes** to disable rogue Q

### **Cost Management**
- **Predictable** resource costs with Q boundaries
- **Automated** optimization recommendations
- **Real-time** spending visibility

### **Developer Experience**
- **Single command** onboarding: `no-wing init`
- **Progressive AI teammate** that earns trust
- **Clear audit trail** for all AI actions

This responsibility matrix ensures that no-wing provides maximum automation while maintaining security, compliance, and cost control through proper separation of duties.
