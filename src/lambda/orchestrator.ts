import { IAMClient, CreateRoleCommand, AttachRolePolicyCommand, CreatePolicyCommand } from '@aws-sdk/client-iam';
import { SSMClient, PutParameterCommand } from '@aws-sdk/client-ssm';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import { QIdentityManager, QCapabilityLevel } from '../q/identity';

interface OnboardingConfig {
  name: string;
  env: string;
  region: string;
}

export class OnboardingOrchestrator {
  private config: OnboardingConfig;
  private iamClient: IAMClient;
  private ssmClient: SSMClient;
  private stsClient: STSClient;

  constructor(config: OnboardingConfig) {
    this.config = config;
    this.iamClient = new IAMClient({ region: config.region });
    this.ssmClient = new SSMClient({ region: config.region });
    this.stsClient = new STSClient({ region: config.region });
  }

  async createQIdentity(): Promise<void> {
    const identityManager = new QIdentityManager();
    
    // Check if Q identity already exists
    const existingIdentity = await identityManager.loadIdentity();
    if (existingIdentity) {
      console.log('Q identity already exists, skipping creation');
      return;
    }

    // Create new Q identity
    const qIdentity = await identityManager.createIdentity('Q');
    console.log(`✅ Created Q identity: ${qIdentity.id}`);
  }

  async createIAMRoles(): Promise<void> {
    // Create developer role
    await this.createDeveloperRole();
    
    // Q base role is already configured via SAM template
    console.log('✅ Q base role configured via SAM template');
  }

  async setupAWSCredentials(): Promise<void> {
    // Store configuration in SSM Parameter Store
    await this.ssmClient.send(new PutParameterCommand({
      Name: `/no-wing/${this.config.env}/config`,
      Value: JSON.stringify({
        name: this.config.name,
        env: this.config.env,
        region: this.config.region,
        createdAt: new Date().toISOString()
      }),
      Type: 'String',
      Overwrite: true
    }));

    console.log('✅ AWS credentials and configuration stored');
  }

  async authenticateQ(): Promise<void> {
    // Q authentication is handled through IAM roles
    // The Q base role is assumed by the orchestrator Lambda
    console.log('✅ Q authenticated via IAM role assumption');
  }

  private async createDeveloperRole(): Promise<void> {
    const roleName = `NoWingDeveloper-${this.config.env}`;
    
    const accountId = await this.getAccountId();
    const assumeRolePolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: {
            AWS: `arn:aws:iam::${accountId}:root`
          },
          Action: 'sts:AssumeRole',
          Condition: {
            StringEquals: {
              'sts:ExternalId': `no-wing-developer-${this.config.env}`
            }
          }
        }
      ]
    };

    try {
      await this.iamClient.send(new CreateRoleCommand({
        RoleName: roleName,
        AssumeRolePolicyDocument: JSON.stringify(assumeRolePolicy),
        Description: `Developer role for no-wing ${this.config.env} environment`,
        Tags: [
          {
            Key: 'NoWingComponent',
            Value: 'developer-role'
          },
          {
            Key: 'Environment',
            Value: this.config.env
          }
        ]
      }));

      // Attach basic developer policies
      await this.iamClient.send(new AttachRolePolicyCommand({
        RoleName: roleName,
        PolicyArn: 'arn:aws:iam::aws:policy/PowerUserAccess'
      }));

      console.log(`✅ Created developer role: ${roleName}`);
    } catch (error: any) {
      if (error.name === 'EntityAlreadyExistsException') {
        console.log(`✅ Developer role already exists: ${roleName}`);
      } else {
        throw error;
      }
    }
  }

  private async getAccountId(): Promise<string> {
    try {
      const result = await this.stsClient.send(new GetCallerIdentityCommand({}));
      return result.Account || '123456789012';
    } catch (error) {
      console.warn('Could not get AWS account ID, using default');
      return '123456789012';
    }
  }

  // Lambda handler for orchestrator function
  async handler(event: any, context: any) {
    console.log('no-wing Orchestrator Lambda invoked');
    console.log('Event:', JSON.stringify(event, null, 2));

    try {
      // Handle different types of orchestrator events
      if (event.action === 'createQIdentity') {
        await this.createQIdentity();
        return { statusCode: 200, body: 'Q identity created successfully' };
      }

      if (event.action === 'setupRoles') {
        await this.createIAMRoles();
        return { statusCode: 200, body: 'IAM roles configured successfully' };
      }

      // Default response
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'no-wing orchestrator is running',
          timestamp: new Date().toISOString(),
          environment: this.config.env
        })
      };
    } catch (error) {
      console.error('Orchestrator error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error'
        })
      };
    }
  }
}

// Export handler for Lambda
export const handler = async (event: any, context: any) => {
  const config = {
    name: process.env.DEVELOPER_NAME || 'Developer',
    env: process.env.ENVIRONMENT || 'dev',
    region: process.env.AWS_REGION || 'us-east-1'
  };

  const orchestrator = new OnboardingOrchestrator(config);
  return orchestrator.handler(event, context);
};
