/**
 * ProjectDetector - Detect project type and generate Q service account configuration
 */

import { promises as fs } from 'fs';
import path from 'path';

export interface ProjectType {
  type: 'sam' | 'cdk' | 'serverless' | 'generic';
  configFile: string;
  permissions: string[];
  deployCommand: string;
  name: string;
}

export interface QServiceAccountConfig {
  username: string;
  projectName: string;
  projectType: ProjectType;
  homeDirectory: string;
  workspace: string;
  gitIdentity: {
    name: string;
    email: string;
  };
  awsProfile: string;
}

export class ProjectDetector {
  private projectPath: string;

  constructor(projectPath: string = process.cwd()) {
    this.projectPath = projectPath;
  }

  /**
   * Detect the project type based on configuration files
   */
  async detect(): Promise<ProjectType> {
    const projectName = path.basename(this.projectPath);

    // Check for SAM project
    if (await this.fileExists('template.yaml') || await this.fileExists('template.yml')) {
      return {
        type: 'sam',
        configFile: await this.fileExists('template.yaml') ? 'template.yaml' : 'template.yml',
        permissions: [
          'lambda:*',
          'apigateway:*',
          'cloudformation:*',
          's3:GetObject',
          's3:PutObject',
          'iam:PassRole'
        ],
        deployCommand: 'sam deploy',
        name: projectName
      };
    }

    // Check for CDK project
    if (await this.fileExists('cdk.json')) {
      return {
        type: 'cdk',
        configFile: 'cdk.json',
        permissions: [
          'cloudformation:*',
          'iam:*',
          's3:*',
          'lambda:*',
          'apigateway:*',
          'dynamodb:*'
        ],
        deployCommand: 'cdk deploy',
        name: projectName
      };
    }

    // Check for Serverless Framework
    if (await this.fileExists('serverless.yml') || await this.fileExists('serverless.yaml')) {
      return {
        type: 'serverless',
        configFile: await this.fileExists('serverless.yml') ? 'serverless.yml' : 'serverless.yaml',
        permissions: [
          'lambda:*',
          'apigateway:*',
          'cloudformation:*',
          's3:*',
          'iam:PassRole'
        ],
        deployCommand: 'serverless deploy',
        name: projectName
      };
    }

    // Default to generic AWS project
    return {
      type: 'generic',
      configFile: '',
      permissions: [
        'lambda:ListFunctions',
        's3:ListBucket',
        'cloudformation:ListStacks'
      ],
      deployCommand: 'aws cloudformation deploy',
      name: projectName
    };
  }

  /**
   * Generate Q service account configuration for the detected project
   */
  async generateQConfig(): Promise<QServiceAccountConfig> {
    const projectType = await this.detect();
    const username = this.generateQUsername(projectType.name);

    return {
      username,
      projectName: projectType.name,
      projectType,
      homeDirectory: `/home/${username}`,
      workspace: `/home/${username}/workspace`,
      gitIdentity: {
        name: `Q Assistant (${projectType.name})`,
        email: `q-assistant+${projectType.name}@no-wing.dev`
      },
      awsProfile: username
    };
  }

  /**
   * Generate a safe username for Q service account
   */
  private generateQUsername(projectName: string): string {
    // Sanitize project name for username
    const sanitized = projectName
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    return `q-assistant-${sanitized}`;
  }

  /**
   * Check if a file exists in the project directory
   */
  private async fileExists(filename: string): Promise<boolean> {
    try {
      await fs.access(path.join(this.projectPath, filename));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get project directory path
   */
  getProjectPath(): string {
    return this.projectPath;
  }

  /**
   * Get project name from directory
   */
  getProjectName(): string {
    return path.basename(this.projectPath);
  }
}
