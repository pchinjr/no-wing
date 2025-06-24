/**
 * IAM Service for managing developer and Q agent roles
 */

import { 
  DeveloperQProvisionRequest, 
  QCapabilityLevel, 
  IAMPolicyTemplate,
  PermissionBoundary,
  ResourceConstraint
} from '../types';

export interface IAMRole {
  roleName: string;
  roleArn: string;
  policyArn?: string;
  permissionBoundaryArn?: string;
}

export class IAMService {
  private region: string;
  private accountId: string;

  constructor(region: string = 'us-east-1') {
    this.region = region;
    this.accountId = process.env.AWS_ACCOUNT_ID || '123456789012';
  }

  /**
   * Create IAM role for human developer
   */
  async createDeveloperRole(
    developerId: string, 
    request: DeveloperQProvisionRequest
  ): Promise<IAMRole> {
    console.log(`🔐 Creating developer IAM role for ${developerId}`);

    const roleName = `no-wing-developer-${developerId}`;
    
    // Create developer policy based on role and projects
    const developerPolicy = this.generateDeveloperPolicy(request);
    
    // Create permission boundary to prevent escalation
    const permissionBoundary = this.generateDeveloperPermissionBoundary(request);

    // In real implementation, this would use AWS SDK to create actual IAM resources
    const role: IAMRole = {
      roleName,
      roleArn: `arn:aws:iam::${this.accountId}:role/${roleName}`,
      policyArn: `arn:aws:iam::${this.accountId}:policy/${roleName}-policy`,
      permissionBoundaryArn: `arn:aws:iam::${this.accountId}:policy/${roleName}-boundary`
    };

    console.log(`✅ Created developer role: ${roleName}`);
    return role;
  }

  /**
   * Create IAM role for Q agent
   */
  async createQRole(
    qId: string, 
    level: QCapabilityLevel, 
    request: DeveloperQProvisionRequest
  ): Promise<IAMRole> {
    console.log(`🤖 Creating Q agent IAM role for ${qId} at ${level} level`);

    const roleName = `no-wing-q-${qId}`;
    
    // Create Q policy based on capability level
    const qPolicy = this.generateQPolicy(level, request);
    
    // Create strict permission boundary for Q
    const qPermissionBoundary = this.generateQPermissionBoundary(level, request);

    // In real implementation, this would use AWS SDK to create actual IAM resources
    const role: IAMRole = {
      roleName,
      roleArn: `arn:aws:iam::${this.accountId}:role/${roleName}`,
      policyArn: `arn:aws:iam::${this.accountId}:policy/${roleName}-policy`,
      permissionBoundaryArn: `arn:aws:iam::${this.accountId}:policy/${roleName}-boundary`
    };

    console.log(`✅ Created Q role: ${roleName} with ${level} permissions`);
    return role;
  }

  /**
   * Generate IAM policy for human developer
   */
  private generateDeveloperPolicy(request: DeveloperQProvisionRequest): IAMPolicyTemplate {
    const baseActions = [
      // Basic AWS access
      'sts:GetCallerIdentity',
      'sts:GetSessionToken',
      
      // CloudFormation (for SAM deployments)
      'cloudformation:DescribeStacks',
      'cloudformation:DescribeStackResources',
      'cloudformation:ListStacks',
      
      // S3 (for deployment artifacts)
      's3:GetObject',
      's3:PutObject',
      's3:ListBucket',
      
      // CloudWatch Logs (for debugging)
      'logs:DescribeLogGroups',
      'logs:DescribeLogStreams',
      'logs:GetLogEvents'
    ];

    // Add role-specific permissions
    const roleSpecificActions = this.getRoleSpecificActions(request.role);
    
    // Add project-specific permissions
    const projectActions = this.getProjectSpecificActions(request.projects);

    return {
      name: `no-wing-developer-${request.developerId}-policy`,
      version: '2012-10-17',
      statement: [
        {
          effect: 'Allow',
          action: [...baseActions, ...roleSpecificActions, ...projectActions],
          resource: this.getResourceConstraints(request)
        },
        {
          effect: 'Deny',
          action: [
            // Prevent assuming Q roles
            'sts:AssumeRole'
          ],
          resource: [`arn:aws:iam::${this.accountId}:role/no-wing-q-*`]
        }
      ]
    };
  }

  /**
   * Generate IAM policy for Q agent based on capability level
   */
  private generateQPolicy(
    level: QCapabilityLevel, 
    request: DeveloperQProvisionRequest
  ): IAMPolicyTemplate {
    const baseActions = [
      'sts:GetCallerIdentity',
      'logs:CreateLogGroup',
      'logs:CreateLogStream',
      'logs:PutLogEvents'
    ];

    let levelActions: string[] = [];

    switch (level) {
      case QCapabilityLevel.OBSERVER:
        levelActions = [
          // Read-only access
          'lambda:ListFunctions',
          'lambda:GetFunction',
          's3:ListAllMyBuckets',
          's3:GetBucketLocation',
          'cloudformation:DescribeStacks',
          'cloudformation:ListStacks'
        ];
        break;

      case QCapabilityLevel.ASSISTANT:
        levelActions = [
          // Observer permissions plus limited modifications
          ...this.generateQPolicy(QCapabilityLevel.OBSERVER, request).statement[0].action,
          'lambda:UpdateFunctionConfiguration',
          'lambda:UpdateFunctionCode',
          's3:PutObject',
          's3:DeleteObject',
          'cloudformation:UpdateStack'
        ];
        break;

      case QCapabilityLevel.PARTNER:
        levelActions = [
          // Assistant permissions plus creation capabilities
          ...this.generateQPolicy(QCapabilityLevel.ASSISTANT, request).statement[0].action,
          'lambda:CreateFunction',
          'lambda:DeleteFunction',
          's3:CreateBucket',
          's3:DeleteBucket',
          'cloudformation:CreateStack',
          'cloudformation:DeleteStack',
          'iam:CreateRole',
          'iam:AttachRolePolicy',
          'iam:PassRole'
        ];
        break;
    }

    return {
      name: `no-wing-q-${level}-policy`,
      version: '2012-10-17',
      statement: [
        {
          effect: 'Allow',
          action: [...baseActions, ...levelActions],
          resource: this.getQResourceARNs(level, request)
        },
        {
          effect: 'Deny',
          action: [
            // Prevent assuming human roles
            'sts:AssumeRole'
          ],
          resource: [`arn:aws:iam::${this.accountId}:role/no-wing-developer-*`]
        }
      ]
    };
  }

  /**
   * Generate permission boundary for developer
   */
  private generateDeveloperPermissionBoundary(
    request: DeveloperQProvisionRequest
  ): PermissionBoundary {
    return {
      policyArn: `arn:aws:iam::${this.accountId}:policy/no-wing-developer-boundary`,
      maxBudget: request.budgetLimit || 1000, // $1000 default monthly limit
      allowedServices: [
        'lambda',
        's3',
        'cloudformation',
        'logs',
        'iam'
      ],
      deniedActions: [
        // Prevent privilege escalation
        'iam:CreateUser',
        'iam:CreateRole',
        'iam:AttachUserPolicy',
        'iam:PutUserPolicy',
        
        // Prevent organization changes
        'organizations:*',
        
        // Prevent billing access
        'aws-portal:*',
        'budgets:*'
      ],
      resourceConstraints: this.getDeveloperResourceConstraints(request)
    };
  }

  /**
   * Generate permission boundary for Q agent
   */
  private generateQPermissionBoundary(
    level: QCapabilityLevel,
    request: DeveloperQProvisionRequest
  ): PermissionBoundary {
    const maxBudget = this.getQBudgetLimit(level, request.budgetLimit);
    
    return {
      policyArn: `arn:aws:iam::${this.accountId}:policy/no-wing-q-${level}-boundary`,
      maxBudget,
      allowedServices: this.getQAllowedServices(level),
      deniedActions: [
        // Always deny these for Q agents
        'iam:CreateUser',
        'iam:DeleteUser',
        'organizations:*',
        'aws-portal:*',
        'budgets:*',
        
        // Prevent Q from modifying its own permissions
        'iam:DetachRolePolicy',
        'iam:DeleteRole',
        'iam:PutRolePermissionsBoundary'
      ],
      resourceConstraints: this.getQResourceConstraints(level, request)
    };
  }

  // Helper methods for generating role-specific permissions
  private getRoleSpecificActions(role: string): string[] {
    switch (role) {
      case 'senior':
        return [
          'lambda:*',
          's3:*',
          'cloudformation:*',
          'iam:ListRoles',
          'iam:GetRole'
        ];
      case 'junior':
        return [
          'lambda:ListFunctions',
          'lambda:GetFunction',
          's3:ListBucket',
          's3:GetObject'
        ];
      case 'contractor':
      case 'intern':
        return [
          'lambda:ListFunctions',
          's3:ListBucket'
        ];
      default:
        return [];
    }
  }

  private getProjectSpecificActions(projects: string[]): string[] {
    // In real implementation, this would map projects to specific permissions
    return projects.flatMap(project => [
      `lambda:*:function:${project}-*`,
      `s3:*:bucket:${project}-*`
    ]);
  }

  private getResourceConstraints(request: DeveloperQProvisionRequest): string[] {
    // Return resource ARN patterns based on role and projects
    return [
      `arn:aws:lambda:${this.region}:${this.accountId}:function:${request.team}-*`,
      `arn:aws:s3:::${request.team}-*`,
      `arn:aws:logs:${this.region}:${this.accountId}:log-group:/aws/lambda/${request.team}-*`
    ];
  }

  private getQResourceARNs(
    level: QCapabilityLevel, 
    request: DeveloperQProvisionRequest
  ): string[] {
    // Q agents have more restrictive resource access
    return [
      `arn:aws:lambda:${this.region}:${this.accountId}:function:q-${request.team}-*`,
      `arn:aws:s3:::q-${request.team}-*`,
      `arn:aws:logs:${this.region}:${this.accountId}:log-group:/aws/lambda/q-${request.team}-*`
    ];
  }

  private getQResourceConstraints(
    level: QCapabilityLevel, 
    request: DeveloperQProvisionRequest
  ): ResourceConstraint[] {
    // Q agents have more restrictive resource access
    return [
      {
        service: 'lambda',
        resourceType: 'function',
        maxCount: 10,
        allowedRegions: [this.region]
      },
      {
        service: 's3',
        resourceType: 'bucket',
        maxCount: 5,
        allowedRegions: [this.region]
      }
    ];
  }

  private getDeveloperResourceConstraints(
    request: DeveloperQProvisionRequest
  ): ResourceConstraint[] {
    return [
      {
        service: 'lambda',
        resourceType: 'function',
        maxCount: 50,
        allowedRegions: [this.region]
      },
      {
        service: 's3',
        resourceType: 'bucket',
        maxCount: 10,
        allowedRegions: [this.region]
      }
    ];
  }

  private getQBudgetLimit(level: QCapabilityLevel, developerBudget?: number): number {
    const baseBudget = developerBudget || 1000;
    
    switch (level) {
      case QCapabilityLevel.OBSERVER:
        return Math.min(50, baseBudget * 0.05); // 5% or $50 max
      case QCapabilityLevel.ASSISTANT:
        return Math.min(200, baseBudget * 0.2); // 20% or $200 max
      case QCapabilityLevel.PARTNER:
        return Math.min(500, baseBudget * 0.5); // 50% or $500 max
      default:
        return 50;
    }
  }

  private getQAllowedServices(level: QCapabilityLevel): string[] {
    const baseServices = ['logs', 'cloudwatch'];
    
    switch (level) {
      case QCapabilityLevel.OBSERVER:
        return [...baseServices, 'lambda', 's3', 'cloudformation'];
      case QCapabilityLevel.ASSISTANT:
        return [...baseServices, 'lambda', 's3', 'cloudformation', 'iam'];
      case QCapabilityLevel.PARTNER:
        return [...baseServices, 'lambda', 's3', 'cloudformation', 'iam', 'apigateway', 'dynamodb'];
      default:
        return baseServices;
    }
  }
}
