#!/usr/bin/env -S deno run --allow-all

/**
 * Resource Discovery Module
 * Discovers and maps AWS resources associated with Q service accounts
 */

import { IAMClient, ListUsersCommand, ListAttachedUserPoliciesCommand, ListUserPoliciesCommand, ListAccessKeysCommand, ListGroupsForUserCommand } from '@aws-sdk/client-iam';
import { ListStacksCommand } from '@aws-sdk/client-cloudformation';
import { S3Client, ListBucketsCommand, GetBucketTaggingCommand } from '@aws-sdk/client-s3';
import { ListFunctionsCommand } from '@aws-sdk/client-lambda';
import { CredentialManager } from '../credentials/CredentialManager.ts';
import { AWSClientFactory } from '../credentials/AWSClientFactory.ts';

/**
 * Represents all AWS resources associated with a Q service account
 */
export interface QServiceAccountResources {
  /** IAM user name */
  user: string;
  /** AWS account ID */
  accountId: string;
  /** Creation timestamp */
  createdDate: Date;
  /** IAM resources */
  iam: {
    accessKeys: AccessKeyInfo[];
    attachedPolicies: PolicyInfo[];
    inlinePolicies: string[];
    groupMemberships: string[];
  };
  /** CloudFormation resources */
  cloudformation: {
    stacks: StackInfo[];
  };
  /** S3 resources */
  s3: {
    buckets: BucketInfo[];
  };
  /** Lambda resources */
  lambda: {
    functions: FunctionInfo[];
  };
  /** Cross-region resource summary */
  regions: string[];
}

export interface AccessKeyInfo {
  accessKeyId: string;
  status: 'Active' | 'Inactive';
  createDate: Date;
}

export interface PolicyInfo {
  policyName: string;
  policyArn: string;
  isCustom: boolean;
}

export interface StackInfo {
  stackName: string;
  stackId: string;
  stackStatus: string;
  creationTime: Date;
  region: string;
}

export interface BucketInfo {
  bucketName: string;
  region: string;
  creationDate: Date;
  tags: Record<string, string>;
}

export interface FunctionInfo {
  functionName: string;
  functionArn: string;
  runtime: string;
  region: string;
  lastModified: Date;
}

/**
 * Discovery options for resource enumeration
 */
export interface ResourceDiscoveryOptions {
  /** Regions to search (default: all regions) */
  regions?: string[];
  /** Include detailed resource information */
  includeDetails?: boolean;
  /** Filter by resource tags */
  tagFilters?: Record<string, string>;
  /** Maximum resources to discover per service */
  maxResources?: number;
}

/**
 * Resource Discovery Service
 * Discovers and catalogs AWS resources associated with Q service accounts
 */
export class ResourceDiscovery {
  private credentialManager: CredentialManager;
  private clientFactory: AWSClientFactory;
  private readonly defaultRegions = [
    'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
    'eu-west-1', 'eu-west-2', 'eu-central-1',
    'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1'
  ];

  constructor(credentialManager: CredentialManager, clientFactory: AWSClientFactory) {
    this.credentialManager = credentialManager;
    this.clientFactory = clientFactory;
  }

  /**
   * Discover all resources associated with a Q service account
   */
  async discoverQServiceAccountResources(
    qServiceAccountName: string,
    options: ResourceDiscoveryOptions = {}
  ): Promise<QServiceAccountResources> {
    const regions = options.regions || this.defaultRegions;
    
    console.log(`🔍 Discovering resources for Q service account: ${qServiceAccountName}`);
    console.log(`📍 Searching in ${regions.length} regions...`);

    // Initialize result structure
    const resources: QServiceAccountResources = {
      user: qServiceAccountName,
      accountId: this.getAccountId(),
      createdDate: new Date(),
      iam: {
        accessKeys: [],
        attachedPolicies: [],
        inlinePolicies: [],
        groupMemberships: []
      },
      cloudformation: {
        stacks: []
      },
      s3: {
        buckets: []
      },
      lambda: {
        functions: []
      },
      regions: regions
    };

    try {
      // Discover IAM resources (global)
      await this.discoverIAMResources(qServiceAccountName, resources);

      // Discover regional resources
      for (const region of regions) {
        console.log(`🌍 Scanning region: ${region}`);
        await this.discoverRegionalResources(qServiceAccountName, region, resources, options);
      }

      console.log(`✅ Resource discovery complete for ${qServiceAccountName}`);
      return resources;

    } catch (error) {
      console.error(`❌ Resource discovery failed: ${error.message}`);
      throw new Error(`Failed to discover resources for ${qServiceAccountName}: ${error.message}`);
    }
  }

  /**
   * Discover IAM resources (global service)
   */
  private async discoverIAMResources(
    qServiceAccountName: string,
    resources: QServiceAccountResources
  ): Promise<void> {
    try {
      const iamClient = await this.clientFactory.getIAMClient();

      // Get user details and creation date
      const userInfo = await this.getUserInfo(iamClient, qServiceAccountName);
      if (userInfo) {
        resources.createdDate = userInfo.createDate;
      }

      // Discover access keys
      resources.iam.accessKeys = await this.discoverAccessKeys(iamClient, qServiceAccountName);

      // Discover attached policies
      resources.iam.attachedPolicies = await this.discoverAttachedPolicies(iamClient, qServiceAccountName);

      // Discover inline policies
      resources.iam.inlinePolicies = await this.discoverInlinePolicies(iamClient, qServiceAccountName);

      // Discover group memberships
      resources.iam.groupMemberships = await this.discoverGroupMemberships(iamClient, qServiceAccountName);

    } catch (error) {
      console.warn(`⚠️ IAM resource discovery failed: ${error.message}`);
    }
  }

  /**
   * Discover resources in a specific region
   */
  private async discoverRegionalResources(
    qServiceAccountName: string,
    region: string,
    resources: QServiceAccountResources,
    options: ResourceDiscoveryOptions
  ): Promise<void> {
    try {
      // Discover CloudFormation stacks
      const stacks = await this.discoverCloudFormationStacks(qServiceAccountName, region, options);
      resources.cloudformation.stacks.push(...stacks);

      // Discover S3 buckets (note: S3 is global but buckets have regions)
      if (region === 'us-east-1') { // Only check S3 once
        const buckets = await this.discoverS3Buckets(qServiceAccountName, options);
        resources.s3.buckets.push(...buckets);
      }

      // Discover Lambda functions
      const functions = await this.discoverLambdaFunctions(qServiceAccountName, region, options);
      resources.lambda.functions.push(...functions);

    } catch (error) {
      console.warn(`⚠️ Regional resource discovery failed for ${region}: ${error.message}`);
    }
  }

  /**
   * Get basic user information
   */
  private async getUserInfo(iamClient: IAMClient, userName: string): Promise<{ createDate: Date } | null> {
    try {
      const command = new ListUsersCommand({});
      const response = await iamClient.send(command);
      
      const user = response.Users?.find(u => u.UserName === userName);
      return user ? { createDate: user.CreateDate || new Date() } : null;
    } catch (error) {
      console.warn(`⚠️ Failed to get user info: ${error.message}`);
      return null;
    }
  }

  /**
   * Discover access keys for the user
   */
  private async discoverAccessKeys(iamClient: IAMClient, userName: string): Promise<AccessKeyInfo[]> {
    try {
      const command = new ListAccessKeysCommand({ UserName: userName });
      const response = await iamClient.send(command);
      
      return response.AccessKeyMetadata?.map(key => ({
        accessKeyId: key.AccessKeyId || '',
        status: key.Status as 'Active' | 'Inactive',
        createDate: key.CreateDate || new Date()
      })) || [];
    } catch (error) {
      console.warn(`⚠️ Failed to discover access keys: ${error.message}`);
      return [];
    }
  }

  /**
   * Discover attached policies
   */
  private async discoverAttachedPolicies(iamClient: IAMClient, userName: string): Promise<PolicyInfo[]> {
    try {
      const command = new ListAttachedUserPoliciesCommand({ UserName: userName });
      const response = await iamClient.send(command);
      
      return response.AttachedPolicies?.map(policy => ({
        policyName: policy.PolicyName || '',
        policyArn: policy.PolicyArn || '',
        isCustom: !policy.PolicyArn?.startsWith('arn:aws:iam::aws:policy/')
      })) || [];
    } catch (error) {
      console.warn(`⚠️ Failed to discover attached policies: ${error.message}`);
      return [];
    }
  }

  /**
   * Discover inline policies
   */
  private async discoverInlinePolicies(iamClient: IAMClient, userName: string): Promise<string[]> {
    try {
      const command = new ListUserPoliciesCommand({ UserName: userName });
      const response = await iamClient.send(command);
      
      return response.PolicyNames || [];
    } catch (error) {
      console.warn(`⚠️ Failed to discover inline policies: ${error.message}`);
      return [];
    }
  }

  /**
   * Discover group memberships
   */
  private async discoverGroupMemberships(iamClient: IAMClient, userName: string): Promise<string[]> {
    try {
      const command = new ListGroupsForUserCommand({ UserName: userName });
      const response = await iamClient.send(command);
      
      return response.Groups?.map(group => group.GroupName || '') || [];
    } catch (error) {
      console.warn(`⚠️ Failed to discover group memberships: ${error.message}`);
      return [];
    }
  }

  /**
   * Discover CloudFormation stacks created by the Q service account
   */
  private async discoverCloudFormationStacks(
    qServiceAccountName: string,
    region: string,
    _options: ResourceDiscoveryOptions
  ): Promise<StackInfo[]> {
    try {
      const cfClient = await this.clientFactory.getCloudFormationClient({ region });
      const command = new ListStacksCommand({
        StackStatusFilter: ['CREATE_COMPLETE', 'UPDATE_COMPLETE', 'ROLLBACK_COMPLETE']
      });
      const response = await cfClient.send(command);
      
      // Filter stacks that might be created by this Q service account
      // This is heuristic-based since CloudFormation doesn't directly track the creator
      const potentialStacks = response.StackSummaries?.filter(stack => {
        const stackName = stack.StackName || '';
        // Look for naming patterns that suggest Q service account creation
        return stackName.includes(qServiceAccountName) || 
               stackName.includes('q-assistant') ||
               stackName.includes('no-wing');
      }) || [];

      return potentialStacks.map(stack => ({
        stackName: stack.StackName || '',
        stackId: stack.StackId || '',
        stackStatus: stack.StackStatus || '',
        creationTime: stack.CreationTime || new Date(),
        region: region
      }));
    } catch (error) {
      console.warn(`⚠️ Failed to discover CloudFormation stacks in ${region}: ${error.message}`);
      return [];
    }
  }

  /**
   * Discover S3 buckets created by the Q service account
   */
  private async discoverS3Buckets(
    qServiceAccountName: string,
    _options: ResourceDiscoveryOptions
  ): Promise<BucketInfo[]> {
    try {
      const s3Client = await this.clientFactory.getS3Client();
      const command = new ListBucketsCommand({});
      const response = await s3Client.send(command);
      
      const buckets: BucketInfo[] = [];
      
      for (const bucket of response.Buckets || []) {
        const bucketName = bucket.Name || '';
        
        // Check if bucket might be created by Q service account
        if (bucketName.includes(qServiceAccountName) || 
            bucketName.includes('q-assistant') ||
            bucketName.includes('no-wing')) {
          
          // Get bucket tags to confirm ownership
          const tags = await this.getBucketTags(s3Client, bucketName);
          
          buckets.push({
            bucketName: bucketName,
            region: 'us-east-1', // Will be updated with actual region
            creationDate: bucket.CreationDate || new Date(),
            tags: tags
          });
        }
      }
      
      return buckets;
    } catch (error) {
      console.warn(`⚠️ Failed to discover S3 buckets: ${error.message}`);
      return [];
    }
  }

  /**
   * Get S3 bucket tags
   */
  private async getBucketTags(s3Client: S3Client, bucketName: string): Promise<Record<string, string>> {
    try {
      const command = new GetBucketTaggingCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      
      const tags: Record<string, string> = {};
      for (const tag of response.TagSet || []) {
        if (tag.Key && tag.Value) {
          tags[tag.Key] = tag.Value;
        }
      }
      return tags;
    } catch (_error) {
      // Bucket might not have tags, which is normal
      return {};
    }
  }

  /**
   * Discover Lambda functions created by the Q service account
   */
  private async discoverLambdaFunctions(
    qServiceAccountName: string,
    region: string,
    options: ResourceDiscoveryOptions
  ): Promise<FunctionInfo[]> {
    try {
      const lambdaClient = await this.clientFactory.getLambdaClient({ region });
      const command = new ListFunctionsCommand({
        MaxItems: options.maxResources || 100
      });
      const response = await lambdaClient.send(command);
      
      // Filter functions that might be created by Q service account
      const potentialFunctions = response.Functions?.filter(func => {
        const functionName = func.FunctionName || '';
        return functionName.includes(qServiceAccountName) ||
               functionName.includes('q-assistant') ||
               functionName.includes('no-wing');
      }) || [];

      return potentialFunctions.map(func => ({
        functionName: func.FunctionName || '',
        functionArn: func.FunctionArn || '',
        runtime: func.Runtime || '',
        region: region,
        lastModified: new Date(func.LastModified || '')
      }));
    } catch (error) {
      console.warn(`⚠️ Failed to discover Lambda functions in ${region}: ${error.message}`);
      return [];
    }
  }

  /**
   * Get current AWS account ID
   */
  private getAccountId(): string {
    try {
      // This is a simplified implementation
      // In practice, you might want to use STS GetCallerIdentity
      return 'unknown';
    } catch (_error) {
      return 'unknown';
    }
  }

  /**
   * Generate a summary report of discovered resources
   */
  generateResourceSummary(resources: QServiceAccountResources): string {
    const summary = [
      `📊 Resource Summary for Q Service Account: ${resources.user}`,
      `🆔 Account ID: ${resources.accountId}`,
      `📅 Created: ${resources.createdDate.toISOString()}`,
      ``,
      `🔐 IAM Resources:`,
      `  • Access Keys: ${resources.iam.accessKeys.length}`,
      `  • Attached Policies: ${resources.iam.attachedPolicies.length}`,
      `  • Inline Policies: ${resources.iam.inlinePolicies.length}`,
      `  • Group Memberships: ${resources.iam.groupMemberships.length}`,
      ``,
      `☁️ CloudFormation:`,
      `  • Stacks: ${resources.cloudformation.stacks.length}`,
      ``,
      `🪣 S3:`,
      `  • Buckets: ${resources.s3.buckets.length}`,
      ``,
      `⚡ Lambda:`,
      `  • Functions: ${resources.lambda.functions.length}`,
      ``,
      `🌍 Regions Scanned: ${resources.regions.length}`
    ];

    return summary.join('\n');
  }
}
