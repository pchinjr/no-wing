# 🧪 Testing AWS Deployment with Q Assistant

## Current Status
✅ **Human deployment works** - Stack `no-wing-test-human-1752108315` deployed successfully  
⚠️ **Q deployment needs AWS credentials** - Run `no-wing aws-setup` first

## How to Test Q's AWS Deployment

### Step 1: Configure Q's AWS Credentials
```bash
no-wing aws-setup
# Choose option 1 (Recommended) to create dedicated IAM user
# OR option 3 to use existing profile for testing
```

### Step 2: Launch Q and Test Deployment
```bash
no-wing launch
```

Then in Q chat, say:
```
Please read the system prompt at /home/pchinjr/.no-wing/service-accounts/no-wing/system-prompt.md and follow its workflow.

I want to test AWS deployment identity separation. Please:

1. First, check your AWS identity by running: aws sts get-caller-identity
2. Then deploy the test CloudFormation stack using: aws cloudformation create-stack --stack-name "q-test-$(date +%s)" --template-body file://test-stack.yaml --parameters ParameterKey=DeployedBy,ParameterValue="Q-Assistant-no-wing" --tags Key=DeployedBy,Value="Q-Assistant"
3. Check the deployment status and compare it with the human-deployed stack

This will demonstrate that:
- Your deployments show as deployed by "Human-pchinjr" 
- Q's deployments show as deployed by "Q-Assistant-no-wing"
- Different AWS identities in CloudTrail
- Clear separation and attribution
```

### Step 3: Verify Identity Separation

After Q deploys, compare:

**Human Stack:**
```bash
aws cloudformation describe-stacks --stack-name no-wing-test-human-1752108315 --query 'Stacks[0].{Status:StackStatus,DeployedBy:Parameters[?ParameterKey==`DeployedBy`].ParameterValue|[0]}'
```

**Q's Stack:**
```bash
aws cloudformation describe-stacks --stack-name [Q's-stack-name] --query 'Stacks[0].{Status:StackStatus,DeployedBy:Parameters[?ParameterKey==`DeployedBy`].ParameterValue|[0]}'
```

### Step 4: Cleanup
```bash
# Delete test stacks
aws cloudformation delete-stack --stack-name no-wing-test-human-1752108315
aws cloudformation delete-stack --stack-name [Q's-stack-name]
```

## Expected Results

| Aspect | Human Deployment | Q Deployment |
|--------|------------------|--------------|
| AWS Identity | `arn:aws:sts::837132623653:assumed-role/AWSReservedSSO_AdministratorAccess_5468dfe8d6d5a44d/paulchinjr` | Q's dedicated IAM user/role |
| Stack Tags | `DeployedBy=Human-pchinjr` | `DeployedBy=Q-Assistant` |
| CloudTrail | Shows your user | Shows Q's user |
| Attribution | Clear human attribution | Clear AI attribution |

## Troubleshooting

If Q can't deploy:
1. Check `no-wing status` - AWS Profile should show ✅
2. Run `no-wing aws-setup` to configure credentials
3. Verify Q's AWS identity: `AWS_PROFILE=q-assistant-no-wing aws sts get-caller-identity`

## Security Benefits Demonstrated

✅ **Separate AWS identities** - Human vs AI deployments clearly distinguished  
✅ **Audit trail** - CloudTrail shows who really deployed what  
✅ **Scoped permissions** - Q gets only necessary permissions  
✅ **No credential sharing** - Your AWS credentials remain private  
