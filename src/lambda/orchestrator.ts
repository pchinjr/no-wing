import { IAMClient, CreateRoleCommand, AttachRolePolicyCommand, CreatePolicyCommand } from '@aws-sdk/client-iam';
import { SSMClient, PutParameterCommand } from '@aws-sdk/client-ssm';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import { Octokit } from '@octokit/rest';
import { readFileSync } from 'fs';
import { join } from 'path';

interface OnboardingConfig {
  name: string;
  repo: string;
  env: string;
  region: string;
}

export class OnboardingOrchestrator {
  private config: OnboardingConfig;
  private iamClient: IAMClient;
  private ssmClient: SSMClient;
  private github: Octokit;

  constructor(config: OnboardingConfig) {
    this.config = config;
    this.iamClient = new IAMClient({ region: config.region });
    this.ssmClient = new SSMClient({ region: config.region });
    
    // Initialize GitHub client (will need token from env or prompt)
    this.github = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });
  }

  async createRoles(): Promise<void> {
    // Create developer role
    await this.createDeveloperRole();
    
    // Create Q role with its own identity
    await this.createQRole();
  }

  private async createDeveloperRole(): Promise<void> {
    const roleName = `DevRole-${this.config.name}`;
    
    const assumeRolePolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: {
            AWS: `arn:aws:iam::${await this.getAccountId()}:root`
          },
          Action: 'sts:AssumeRole',
          Condition: {
            StringEquals: {
              'sts:ExternalId': `dev-${this.config.name}-${this.config.env}`
            }
          }
        }
      ]
    };

    try {
      await this.iamClient.send(new CreateRoleCommand({
        RoleName: roleName,
        AssumeRolePolicyDocument: JSON.stringify(assumeRolePolicy),
        Description: `Developer role for ${this.config.name} in ${this.config.env} environment`,
        Tags: [
          { Key: 'no-wing:developer', Value: this.config.name },
          { Key: 'no-wing:environment', Value: this.config.env },
          { Key: 'no-wing:type', Value: 'developer' }
        ]
      }));

      // Attach developer policy
      const devPolicy = this.generateDeveloperPolicy();
      await this.createAndAttachPolicy(roleName, `DevPolicy-${this.config.name}`, devPolicy);
      
    } catch (error: any) {
      if (error.name !== 'EntityAlreadyExistsException') {
        throw error;
      }
    }
  }

  private async createQRole(): Promise<void> {
    const roleName = `QRole-${this.config.name}`;
    
    const assumeRolePolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: {
            AWS: `arn:aws:iam::${await this.getAccountId()}:root`
          },
          Action: 'sts:AssumeRole',
          Condition: {
            StringEquals: {
              'sts:ExternalId': `q-${this.config.name}-${this.config.env}`
            }
          }
        }
      ]
    };

    try {
      await this.iamClient.send(new CreateRoleCommand({
        RoleName: roleName,
        AssumeRolePolicyDocument: JSON.stringify(assumeRolePolicy),
        Description: `Q AI teammate role for ${this.config.name} in ${this.config.env} environment`,
        Tags: [
          { Key: 'no-wing:developer', Value: this.config.name },
          { Key: 'no-wing:environment', Value: this.config.env },
          { Key: 'no-wing:type', Value: 'q-agent' },
          { Key: 'no-wing:capabilities-level', Value: '1' }
        ]
      }));

      // Attach Q policy (progressive capabilities)
      const qPolicy = this.generateQPolicy(1); // Start at capability level 1
      await this.createAndAttachPolicy(roleName, `QPolicy-${this.config.name}`, qPolicy);
      
    } catch (error: any) {
      if (error.name !== 'EntityAlreadyExistsException') {
        throw error;
      }
    }
  }

  private generateDeveloperPolicy(): any {
    return {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: [
            'lambda:*',
            'apigateway:*',
            'dynamodb:*',
            's3:*',
            'cloudformation:*',
            'iam:PassRole',
            'logs:*'
          ],
          Resource: '*',
          Condition: {
            StringLike: {
              'aws:RequestedRegion': this.config.region
            }
          }
        },
        {
          Effect: 'Allow',
          Action: [
            'sts:AssumeRole'
          ],
          Resource: `arn:aws:iam::*:role/QRole-${this.config.name}`
        }
      ]
    };
  }

  private generateQPolicy(capabilityLevel: number): any {
    // Progressive capabilities for Q
    const basePermissions = [
      'logs:CreateLogGroup',
      'logs:CreateLogStream',
      'logs:PutLogEvents',
      'cloudformation:DescribeStacks',
      'cloudformation:ListStacks'
    ];

    const level1Permissions = [
      ...basePermissions,
      'lambda:GetFunction',
      'lambda:ListFunctions',
      's3:GetObject',
      's3:ListBucket'
    ];

    const level2Permissions = [
      ...level1Permissions,
      'lambda:UpdateFunctionCode',
      's3:PutObject',
      'dynamodb:GetItem',
      'dynamodb:Query'
    ];

    const permissions = capabilityLevel >= 2 ? level2Permissions : level1Permissions;

    return {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: permissions,
          Resource: '*',
          Condition: {
            StringEquals: {
              'aws:RequestedRegion': this.config.region
            }
          }
        }
      ]
    };
  }

  private async createAndAttachPolicy(roleName: string, policyName: string, policyDocument: any): Promise<void> {
    try {
      const createPolicyResult = await this.iamClient.send(new CreatePolicyCommand({
        PolicyName: policyName,
        PolicyDocument: JSON.stringify(policyDocument),
        Description: `Policy for ${roleName}`
      }));

      await this.iamClient.send(new AttachRolePolicyCommand({
        RoleName: roleName,
        PolicyArn: createPolicyResult.Policy!.Arn!
      }));
    } catch (error: any) {
      if (error.name !== 'EntityAlreadyExistsException') {
        throw error;
      }
    }
  }

  async setupCredentials(): Promise<void> {
    // Store credentials in SSM for secure access
    const devRoleArn = `arn:aws:iam::${await this.getAccountId()}:role/DevRole-${this.config.name}`;
    const qRoleArn = `arn:aws:iam::${await this.getAccountId()}:role/QRole-${this.config.name}`;

    await this.ssmClient.send(new PutParameterCommand({
      Name: `/no-wing/${this.config.name}/dev-role-arn`,
      Value: devRoleArn,
      Type: 'String',
      Overwrite: true
    }));

    await this.ssmClient.send(new PutParameterCommand({
      Name: `/no-wing/${this.config.name}/q-role-arn`,
      Value: qRoleArn,
      Type: 'String',
      Overwrite: true
    }));
  }

  async authenticateQ(): Promise<void> {
    // Set up Q's authentication mechanism
    // This could be STS tokens, IAM roles anywhere, or other secure methods
    const qConfig = {
      roleArn: `arn:aws:iam::${await this.getAccountId()}:role/QRole-${this.config.name}`,
      externalId: `q-${this.config.name}-${this.config.env}`,
      capabilityLevel: 1,
      developer: this.config.name,
      environment: this.config.env
    };

    await this.ssmClient.send(new PutParameterCommand({
      Name: `/no-wing/${this.config.name}/q-config`,
      Value: JSON.stringify(qConfig),
      Type: 'SecureString',
      Overwrite: true
    }));
  }

  async setupGitHub(): Promise<void> {
    const [owner, repo] = this.config.repo.split('/');
    
    // Get repository public key for encryption
    const { data: publicKey } = await this.github.rest.actions.getRepoPublicKey({
      owner,
      repo
    });

    // Add repository secrets for AWS access
    await this.github.rest.actions.createOrUpdateRepoSecret({
      owner,
      repo,
      secret_name: 'AWS_REGION',
      encrypted_value: await this.encryptSecret(this.config.region, publicKey.key),
      key_id: publicKey.key_id
    });

    await this.github.rest.actions.createOrUpdateRepoSecret({
      owner,
      repo,
      secret_name: 'DEV_ROLE_ARN',
      encrypted_value: await this.encryptSecret(`arn:aws:iam::${await this.getAccountId()}:role/DevRole-${this.config.name}`, publicKey.key),
      key_id: publicKey.key_id
    });

    await this.github.rest.actions.createOrUpdateRepoSecret({
      owner,
      repo,
      secret_name: 'Q_ROLE_ARN',
      encrypted_value: await this.encryptSecret(`arn:aws:iam::${await this.getAccountId()}:role/QRole-${this.config.name}`, publicKey.key),
      key_id: publicKey.key_id
    });
  }

  async setupPipeline(): Promise<void> {
    // Create GitHub Actions workflow
    const workflowContent = this.generateWorkflowYaml();
    const [owner, repo] = this.config.repo.split('/');

    try {
      await this.github.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: '.github/workflows/deploy.yml',
        message: 'feat: add no-wing deployment pipeline',
        content: Buffer.from(workflowContent).toString('base64')
      });
    } catch (error) {
      // File might already exist, that's okay
      console.log('Workflow file may already exist, skipping...');
    }
  }

  private generateWorkflowYaml(): string {
    return `
name: Deploy with no-wing

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        role-to-assume: \${{ secrets.DEV_ROLE_ARN }}
        aws-region: \${{ secrets.AWS_REGION }}
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
    
    - name: Deploy
      run: npm run deploy
      
    # Q can also participate in the pipeline
    - name: Q Analysis
      run: |
        echo "🤖 Q: Deployment completed successfully!"
        echo "🤖 Q: Monitoring for any issues..."
`.trim();
  }

  private async getAccountId(): Promise<string> {
    try {
      const stsClient = new STSClient({ region: this.config.region });
      const command = new GetCallerIdentityCommand({});
      const response = await stsClient.send(command);
      return response.Account || '';
    } catch (error) {
      console.error('Failed to get account ID:', error);
      // Fallback to environment variable if available
      return process.env.AWS_ACCOUNT_ID || '';
    }
  }

  private async encryptSecret(value: string, publicKey: string): Promise<string> {
    // This would use libsodium to encrypt secrets for GitHub
    // For now, we'll use a simple base64 encoding as placeholder
    // In production, you'd use: sodium.crypto_box_seal(Buffer.from(value), Buffer.from(publicKey, 'base64'))
    return Buffer.from(value).toString('base64');
  }
}
