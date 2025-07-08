/**
 * PolicyGenerator - Generate AWS IAM policies based on project type
 */

import type { ProjectType } from './ProjectDetector.js';

export interface PolicySet {
  managedPolicies: string[];
  inlinePolicy?: {
    name: string;
    document: any;
  };
}

export class PolicyGenerator {
  /**
   * Generate appropriate policies for a project type
   */
  static generatePolicies(projectType: ProjectType): PolicySet {
    switch (projectType.type) {
      case 'sam':
        return this.generateSAMPolicies();
      case 'cdk':
        return this.generateCDKPolicies();
      case 'serverless':
        return this.generateServerlessPolicies();
      case 'generic':
      default:
        return this.generateGenericPolicies();
    }
  }

  /**
   * Generate policies for SAM projects
   */
  private static generateSAMPolicies(): PolicySet {
    return {
      managedPolicies: [
        'arn:aws:iam::aws:policy/AWSCloudFormationFullAccess',
        'arn:aws:iam::aws:policy/AWSLambda_FullAccess',
        'arn:aws:iam::aws:policy/AmazonAPIGatewayAdministrator',
        'arn:aws:iam::aws:policy/AmazonS3FullAccess'
      ],
      inlinePolicy: {
        name: 'SAMDeploymentPolicy',
        document: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'iam:CreateRole',
                'iam:DeleteRole',
                'iam:GetRole',
                'iam:PassRole',
                'iam:AttachRolePolicy',
                'iam:DetachRolePolicy',
                'iam:PutRolePolicy',
                'iam:DeleteRolePolicy'
              ],
              Resource: 'arn:aws:iam::*:role/*'
            },
            {
              Effect: 'Allow',
              Action: [
                'logs:CreateLogGroup',
                'logs:DeleteLogGroup',
                'logs:DescribeLogGroups',
                'logs:PutRetentionPolicy'
              ],
              Resource: 'arn:aws:logs:*:*:*'
            }
          ]
        }
      }
    };
  }

  /**
   * Generate policies for CDK projects
   */
  private static generateCDKPolicies(): PolicySet {
    return {
      managedPolicies: [
        'arn:aws:iam::aws:policy/PowerUserAccess'
      ],
      inlinePolicy: {
        name: 'CDKDeploymentPolicy',
        document: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'iam:*',
                'organizations:DescribeOrganization',
                'account:GetContactInformation',
                'account:GetAlternateContact',
                'account:GetAccountInformation'
              ],
              Resource: '*'
            }
          ]
        }
      }
    };
  }

  /**
   * Generate policies for Serverless Framework projects
   */
  private static generateServerlessPolicies(): PolicySet {
    return {
      managedPolicies: [
        'arn:aws:iam::aws:policy/AWSCloudFormationFullAccess',
        'arn:aws:iam::aws:policy/AWSLambda_FullAccess',
        'arn:aws:iam::aws:policy/AmazonAPIGatewayAdministrator',
        'arn:aws:iam::aws:policy/AmazonS3FullAccess',
        'arn:aws:iam::aws:policy/CloudWatchLogsFullAccess'
      ],
      inlinePolicy: {
        name: 'ServerlessDeploymentPolicy',
        document: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'iam:CreateRole',
                'iam:DeleteRole',
                'iam:GetRole',
                'iam:PassRole',
                'iam:AttachRolePolicy',
                'iam:DetachRolePolicy',
                'iam:PutRolePolicy',
                'iam:DeleteRolePolicy',
                'iam:TagRole',
                'iam:UntagRole'
              ],
              Resource: 'arn:aws:iam::*:role/*'
            },
            {
              Effect: 'Allow',
              Action: [
                'events:*',
                'scheduler:*'
              ],
              Resource: '*'
            }
          ]
        }
      }
    };
  }

  /**
   * Generate minimal policies for generic projects
   */
  private static generateGenericPolicies(): PolicySet {
    return {
      managedPolicies: [
        'arn:aws:iam::aws:policy/ReadOnlyAccess'
      ],
      inlinePolicy: {
        name: 'BasicDeploymentPolicy',
        document: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'cloudformation:DescribeStacks',
                'cloudformation:ListStacks',
                'lambda:ListFunctions',
                's3:ListBucket',
                's3:GetObject'
              ],
              Resource: '*'
            }
          ]
        }
      }
    };
  }

  /**
   * Get minimal read-only policies for initial setup
   */
  static getMinimalPolicies(): PolicySet {
    return {
      managedPolicies: [
        'arn:aws:iam::aws:policy/ReadOnlyAccess'
      ]
    };
  }

  /**
   * Validate policy ARN format
   */
  static isValidPolicyArn(arn: string): boolean {
    const arnPattern = /^arn:aws:iam::(aws|\d{12}):policy\/[\w+=,.@-]+$/;
    return arnPattern.test(arn);
  }

  /**
   * Get policy summary for display
   */
  static getPolicySummary(policySet: PolicySet): string[] {
    const summary: string[] = [];
    
    summary.push(`Managed Policies: ${policySet.managedPolicies.length}`);
    policySet.managedPolicies.forEach(policy => {
      const policyName = policy.split('/').pop() || policy;
      summary.push(`  • ${policyName}`);
    });

    if (policySet.inlinePolicy) {
      summary.push(`Inline Policy: ${policySet.inlinePolicy.name}`);
      const statementCount = policySet.inlinePolicy.document.Statement?.length || 0;
      summary.push(`  • ${statementCount} permission statements`);
    }

    return summary;
  }
}
