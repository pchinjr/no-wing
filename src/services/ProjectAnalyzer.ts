/**
 * Project Analyzer - Understands the context of your AWS serverless project
 */

import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { ProjectContext, GitContext, LambdaFunction } from '../types';

export class ProjectAnalyzer {
  
  /**
   * Analyze the current project directory
   */
  async analyzeProject(projectPath: string = process.cwd()): Promise<ProjectContext> {
    console.log(`🔍 Analyzing project at: ${projectPath}`);
    
    const context: ProjectContext = {
      name: path.basename(projectPath),
      path: projectPath,
      type: 'generic',
      awsRegion: 'us-east-1',
      awsAccountId: ''
    };

    // Detect project type
    context.type = await this.detectProjectType(projectPath);
    console.log(`📋 Project type: ${context.type}`);

    // Get AWS context
    const awsContext = await this.getAWSContext();
    context.awsRegion = awsContext.region;
    context.awsAccountId = awsContext.accountId;
    console.log(`☁️  AWS Account: ${context.awsAccountId} (${context.awsRegion})`);

    // Analyze Git context
    context.gitRepo = await this.analyzeGitContext(projectPath);
    if (context.gitRepo.isRepo) {
      console.log(`📦 Git repo: ${context.gitRepo.branch} branch`);
    }

    // Project-specific analysis
    if (context.type === 'sam') {
      context.samTemplate = await this.findSAMTemplate(projectPath);
      context.lambdaFunctions = await this.analyzeSAMFunctions(projectPath);
      console.log(`🔧 SAM template: ${context.samTemplate}`);
      console.log(`⚡ Lambda functions: ${context.lambdaFunctions?.length || 0}`);
    }

    // Load package.json if exists
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      context.packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      console.log(`📦 Package: ${context.packageJson.name}@${context.packageJson.version}`);
    }

    return context;
  }

  /**
   * Detect the type of serverless project
   */
  private async detectProjectType(projectPath: string): Promise<'sam' | 'cdk' | 'serverless' | 'generic'> {
    // Check for SAM
    if (fs.existsSync(path.join(projectPath, 'template.yaml')) || 
        fs.existsSync(path.join(projectPath, 'template.yml'))) {
      return 'sam';
    }

    // Check for CDK
    if (fs.existsSync(path.join(projectPath, 'cdk.json'))) {
      return 'cdk';
    }

    // Check for Serverless Framework
    if (fs.existsSync(path.join(projectPath, 'serverless.yml')) ||
        fs.existsSync(path.join(projectPath, 'serverless.yaml'))) {
      return 'serverless';
    }

    return 'generic';
  }

  /**
   * Get current AWS context
   */
  private async getAWSContext(): Promise<{ region: string; accountId: string }> {
    try {
      // Try to get AWS account info
      const { STSClient, GetCallerIdentityCommand } = await import('@aws-sdk/client-sts');
      const client = new STSClient({});
      const result = await client.send(new GetCallerIdentityCommand({}));
      
      return {
        region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1',
        accountId: result.Account || 'unknown'
      };
    } catch (error) {
      console.log('⚠️  Could not get AWS context, using defaults');
      return {
        region: 'us-east-1',
        accountId: 'unknown'
      };
    }
  }

  /**
   * Analyze Git context
   */
  private async analyzeGitContext(projectPath: string): Promise<GitContext> {
    const gitContext: GitContext = {
      isRepo: false,
      branch: 'main'
    };

    try {
      // Check if it's a git repo
      if (!fs.existsSync(path.join(projectPath, '.git'))) {
        return gitContext;
      }

      gitContext.isRepo = true;

      // Get current branch
      const branch = await this.execGitCommand('rev-parse --abbrev-ref HEAD', projectPath);
      gitContext.branch = branch.trim();

      // Get remote URL
      try {
        const remote = await this.execGitCommand('config --get remote.origin.url', projectPath);
        gitContext.remote = remote.trim();
      } catch (e) {
        // No remote configured
      }

      // Get last commit
      try {
        const lastCommit = await this.execGitCommand('log -1 --format="%H %s"', projectPath);
        gitContext.lastCommit = lastCommit.trim();
      } catch (e) {
        // No commits yet
      }

      // Get git user info
      try {
        const name = await this.execGitCommand('config user.name', projectPath);
        const email = await this.execGitCommand('config user.email', projectPath);
        gitContext.authorName = name.trim();
        gitContext.authorEmail = email.trim();
      } catch (e) {
        // Git user not configured
      }

    } catch (error) {
      // Not a git repo or git not available
    }

    return gitContext;
  }

  /**
   * Find SAM template file
   */
  private async findSAMTemplate(projectPath: string): Promise<string | undefined> {
    const possibleTemplates = ['template.yaml', 'template.yml', 'sam.yaml', 'sam.yml'];
    
    for (const template of possibleTemplates) {
      const templatePath = path.join(projectPath, template);
      if (fs.existsSync(templatePath)) {
        return template;
      }
    }
    
    return undefined;
  }

  /**
   * Analyze Lambda functions in SAM template
   */
  private async analyzeSAMFunctions(projectPath: string): Promise<LambdaFunction[]> {
    const functions: LambdaFunction[] = [];
    const templatePath = await this.findSAMTemplate(projectPath);
    
    if (!templatePath) {
      return functions;
    }

    try {
      // Simple YAML parsing for Lambda functions
      const templateContent = fs.readFileSync(path.join(projectPath, templatePath), 'utf8');
      
      // Basic regex to find Lambda functions (simplified)
      const functionMatches = templateContent.match(/(\w+Function):\s*\n\s*Type:\s*AWS::Serverless::Function/g);
      
      if (functionMatches) {
        for (const match of functionMatches) {
          const nameMatch = match.match(/(\w+Function):/);
          if (nameMatch) {
            functions.push({
              name: nameMatch[1],
              runtime: 'nodejs18.x', // Default, would parse from template
              handler: 'index.handler', // Default, would parse from template
              codeUri: './src' // Default, would parse from template
            });
          }
        }
      }
    } catch (error) {
      console.log('⚠️  Could not parse SAM template');
    }

    return functions;
  }

  /**
   * Execute git command
   */
  private execGitCommand(command: string, cwd: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const [cmd, ...args] = `git ${command}`.split(' ');
      const process = spawn(cmd, args, { cwd });
      
      let stdout = '';
      let stderr = '';
      
      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      process.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(stderr));
        }
      });
    });
  }
}
