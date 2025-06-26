/**
 * Core types for no-wing Guardian Angel
 */

export interface ProjectContext {
  name: string;
  path: string;
  type: 'sam' | 'cdk' | 'serverless' | 'generic';
  awsRegion: string;
  awsAccountId: string;
  samTemplate?: string;
  packageJson?: any;
  gitRepo?: GitContext;
  lambdaFunctions?: LambdaFunction[];
}

export interface GitContext {
  isRepo: boolean;
  branch: string;
  remote?: string;
  lastCommit?: string;
  authorName?: string;
  authorEmail?: string;
}

export interface QConfiguration {
  projectContext: ProjectContext;
  commitAuthor: {
    name: string;
    email: string;
  };
  awsProfile?: string;
  samConfig?: SAMConfig;
  preferences: QPreferences;
}

export interface SAMConfig {
  stackName?: string;
  s3Bucket?: string;
  region: string;
  capabilities?: string[];
  tags?: Record<string, string>;
}

export interface QPreferences {
  autoCommit: boolean;
  commitMessagePrefix: string;
  deployOnCreate: boolean;
  testAfterDeploy: boolean;
  verboseLogging: boolean;
}

export interface LambdaFunction {
  name: string;
  runtime: string;
  handler: string;
  codeUri: string;
  events?: any[];
}
