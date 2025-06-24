# 🛫 no-wing

**Enterprise Developer+Q Vending System for AWS Lambda Hackathon**

Provision developers with AI assistants (Q) that create real AWS Lambda functions while maintaining enterprise governance.

## 🏆 AWS Lambda Hackathon Entry

### **Problem Solved**
Enterprise developer onboarding is slow and expensive. New developers need weeks to become productive with AWS Lambda development.

### **Solution**
**no-wing** vends developer+Q pairs where Q is an AI assistant that:
- Creates **real AWS Lambda functions** with working code
- Sets up **API Gateway triggers** automatically  
- Maintains **enterprise IAM governance**
- Provides **real-time monitoring** and compliance

## 🚀 Quick Demo

```bash
# 1. Admin provisions developer+Q pair
npm run demo

# 2. Q creates REAL Lambda function
no-wing chat
> "create a Lambda function for user authentication"
# → Deploys actual Lambda + API Gateway to AWS!
```

## 🏗️ Architecture

```
Admin → Provisions → Developer+Q Pair → Creates → Real AWS Lambda Functions
                         ↓
                   Monitored & Governed
```

### **Core Components:**
- **VendingService**: Provisions developer+Q pairs with IAM
- **AWSLambdaService**: Creates real Lambda functions with API Gateway
- **MonitoringService**: Tracks Q activities for compliance
- **IAMService**: Manages roles and permission boundaries

## 🔐 Enterprise Security

### **IAM Separation:**
- **Human developers** get project-specific AWS permissions
- **Q agents** get limited, monitored Lambda creation permissions
- **Permission boundaries** prevent privilege escalation
- **Progressive capabilities**: Observer → Assistant → Partner

### **Real-Time Monitoring:**
- All Q activities logged and tracked
- Cost monitoring with budget alerts
- Anomaly detection for unusual behavior
- Compliance reporting for audits

## 🎯 Hackathon Requirements Met

✅ **AWS Lambda as core service** - Q creates real Lambda functions  
✅ **Lambda triggers** - API Gateway integration  
✅ **Real-world business problem** - Enterprise developer onboarding  
✅ **Multiple AWS services** - Lambda, IAM, API Gateway, CloudWatch  

## 🛠️ Installation

```bash
git clone https://github.com/pchinjr/no-wing.git
cd no-wing
npm install
npm run build
```

## 📋 Prerequisites

- Node.js 18+
- AWS CLI configured with credentials
- Permissions for Lambda, IAM, and API Gateway

## 🎬 Usage

### **Admin: Provision Developer+Q Pair**
```bash
no-wing admin provision-developer \
  --email sarah@company.com \
  --role junior \
  --team backend \
  --projects user-service
```

### **Developer: Onboard with Q**
```bash
no-wing setup --token <onboarding-token>
no-wing chat
```

### **Q: Create Real Lambda Functions**
```bash
> "create a Lambda function for user authentication"
> "create an API endpoint for data processing"  
> "list my Lambda functions"
> "analyze my current functions"
```

## 🏆 What Makes This Special

### **Real AWS Integration**
- Creates actual Lambda functions (not simulations)
- Generates working Node.js code
- Sets up API Gateway endpoints
- Proper IAM execution roles

### **Enterprise Ready**
- Multi-tenant Q agent management
- Proper security boundaries
- Audit trails and compliance
- Cost tracking and budgets

### **AI-Powered Development**
- Natural language Lambda creation
- Company-aware Q assistants
- Progressive capability earning
- Safe experimentation environment

## 🚀 Demo Script

Run the complete hackathon demo:
```bash
./demo-hackathon.sh
```

This will:
1. Provision a developer+Q pair
2. Set up the developer environment  
3. Have Q create a real Lambda function
4. Show the deployed AWS resources

## 📊 Example Output

```
🤖 Q: 🎉 Successfully created Lambda function "q-auth-123456"!

🏗️ AWS Resources Created:
   • AWS::Lambda::Function: q-auth-123456
     ARN: arn:aws:lambda:us-east-1:123456789012:function:q-auth-123456
     🌐 Endpoint: https://abc123.execute-api.us-east-1.amazonaws.com/prod
     ⏱️ Deployment time: 3247ms
     💰 Estimated cost: $0.050
```

## 🎯 Business Value

- **Faster onboarding**: Developers productive in hours, not weeks
- **Consistent practices**: Q enforces company standards  
- **Reduced mentoring**: Senior developers focus on architecture
- **Audit compliance**: Complete activity tracking
- **Cost control**: Budget limits and monitoring

---

**Enterprise-grade AI assistant provisioning with real AWS Lambda creation.** 🛫

*Built for the AWS Lambda Hackathon - Transforming developer onboarding with AI.*
