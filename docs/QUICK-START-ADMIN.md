# Quick Start: AWS Admin Setup

## 🚀 **Get no-wing Production Ready in 30 Minutes**

This is your streamlined checklist to get no-wing ready for real AWS integration. Follow these steps in order.

---

## ⏱️ **Time Estimate: 30 minutes**

- **Phase 1**: Foundation Setup (15 minutes)
- **Phase 2**: Security & Monitoring (10 minutes)  
- **Phase 3**: Validation & Testing (5 minutes)

---

## 📋 **Phase 1: Foundation Setup (15 minutes)**

### **Step 1: Create Master Roles** (5 minutes)

```bash
# 1. Create orchestrator role (Q's boss)
aws iam create-role --role-name NoWingOrchestratorRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "lambda.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

# 2. Give orchestrator admin permissions
aws iam attach-role-policy \
  --role-name NoWingOrchestratorRole \
  --policy-arn arn:aws:iam::aws:policy/IAMFullAccess

aws iam attach-role-policy \
  --role-name NoWingOrchestratorRole \
  --policy-arn arn:aws:iam::aws:policy/AWSLambdaExecute

# 3. Create Q base role template
aws iam create-role --role-name NoWingQBaseRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"AWS": "arn:aws:iam::ACCOUNT-ID:role/NoWingOrchestratorRole"},
      "Action": "sts:AssumeRole"
    }]
  }'
```

### **Step 2: Set Permission Boundaries** (5 minutes)

```bash
# 1. Create Q permission boundary policy
cat > q-boundary.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Action": [
        "iam:*",
        "organizations:*",
        "account:*",
        "billing:*"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": "*",
      "Resource": "*"
    }
  ]
}
EOF

# 2. Create the policy
aws iam create-policy \
  --policy-name NoWingQPermissionBoundary \
  --policy-document file://q-boundary.json

# 3. Apply boundary to Q base role
aws iam put-role-permissions-boundary \
  --role-name NoWingQBaseRole \
  --permissions-boundary arn:aws:iam::ACCOUNT-ID:policy/NoWingQPermissionBoundary
```

### **Step 3: Deploy Control Plane** (5 minutes)

```bash
# 1. Build orchestrator package
cd no-wing
npm run build
zip -r orchestrator.zip dist/ node_modules/ package.json

# 2. Deploy orchestrator Lambda
aws lambda create-function \
  --function-name no-wing-orchestrator \
  --runtime nodejs18.x \
  --role arn:aws:iam::ACCOUNT-ID:role/NoWingOrchestratorRole \
  --handler dist/lambda/orchestrator.handler \
  --zip-file fileb://orchestrator.zip \
  --timeout 300 \
  --memory-size 512 \
  --environment Variables='{
    "NODE_ENV": "production",
    "Q_BASE_ROLE_ARN": "arn:aws:iam::ACCOUNT-ID:role/NoWingQBaseRole"
  }'
```

---

## 🔒 **Phase 2: Security & Monitoring (10 minutes)**

### **Step 4: Enable Audit Trail** (3 minutes)

```bash
# 1. Create audit bucket
aws s3 mb s3://no-wing-audit-$(aws sts get-caller-identity --query Account --output text)

# 2. Enable CloudTrail
aws cloudtrail create-trail \
  --name no-wing-audit \
  --s3-bucket-name no-wing-audit-$(aws sts get-caller-identity --query Account --output text) \
  --include-global-service-events

aws cloudtrail start-logging --name no-wing-audit
```

### **Step 5: Set Up Monitoring** (4 minutes)

```bash
# 1. Create log groups
aws logs create-log-group --log-group-name /no-wing/orchestrator
aws logs create-log-group --log-group-name /no-wing/q-activities

# 2. Set retention
aws logs put-retention-policy \
  --log-group-name /no-wing/q-activities \
  --retention-in-days 30

# 3. Create cost alert
aws budgets create-budget \
  --account-id $(aws sts get-caller-identity --query Account --output text) \
  --budget '{
    "BudgetName": "NoWingMonthlyCost",
    "BudgetLimit": {"Amount": "500", "Unit": "USD"},
    "TimeUnit": "MONTHLY",
    "BudgetType": "COST"
  }'
```

### **Step 6: GitHub Integration** (3 minutes)

```bash
# 1. Store GitHub secrets (replace with your values)
aws secretsmanager create-secret \
  --name no-wing/github-config \
  --secret-string '{
    "appId": "YOUR_GITHUB_APP_ID",
    "installationId": "YOUR_INSTALLATION_ID",
    "privateKey": "YOUR_PRIVATE_KEY_BASE64"
  }'
```

---

## ✅ **Phase 3: Validation & Testing (5 minutes)**

### **Step 7: Test the Setup** (5 minutes)

```bash
# 1. Test orchestrator can run
aws lambda invoke \
  --function-name no-wing-orchestrator \
  --payload '{"action": "health-check"}' \
  response.json

cat response.json

# 2. Test Q role assumption
aws sts assume-role \
  --role-arn arn:aws:iam::ACCOUNT-ID:role/NoWingQBaseRole \
  --role-session-name test-q-session

# 3. Verify CloudTrail is logging
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=AssumeRole \
  --start-time $(date -d '5 minutes ago' -u +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S)
```

---

## 🎯 **You're Done! What's Next?**

### **Immediate Next Steps**
1. **Test no-wing CLI**: `no-wing init --name=TestUser --repo=test/repo`
2. **Onboard first developer**: Real AWS resources will be created
3. **Monitor Q activities**: Check CloudWatch logs
4. **Review costs**: Monitor spending in AWS console

### **What Q Can Now Do For You**
- ✅ **Onboard developers** with real AWS credentials
- ✅ **Create Lambda functions** for projects
- ✅ **Set up S3 buckets** with proper policies
- ✅ **Deploy applications** to real environments
- ✅ **Manage team access** and permissions
- ✅ **Generate reports** on usage and costs

### **What You Still Control**
- 🔐 **Root permissions** and security boundaries
- 💰 **Cost limits** and spending controls
- 📊 **Audit trails** and compliance
- 🚨 **Emergency stops** and overrides

---

## 🆘 **Emergency Commands**

### **Stop All Q Activity**
```bash
# Disable orchestrator (stops all Q agents)
aws iam attach-role-policy \
  --role-name NoWingOrchestratorRole \
  --policy-arn arn:aws:iam::aws:policy/AWSDenyAll
```

### **Check Q Activity**
```bash
# See what Q has been doing
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=UserName,AttributeValue=no-wing-orchestrator
```

### **Cost Check**
```bash
# Check current month spending
aws ce get-cost-and-usage \
  --time-period Start=$(date +%Y-%m-01),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost
```

---

## 🎉 **Success!**

You've successfully set up no-wing for production use! The system is now ready to:

- **Autonomously onboard** developers and AI teammates
- **Progressively trust** Q agents as they prove themselves
- **Maintain security** through permission boundaries
- **Track all activity** through comprehensive auditing
- **Control costs** through automated monitoring

**Time to let Q fly!** 🛫

Run `no-wing init` and watch as both human and AI teammates get onboarded together automatically.
