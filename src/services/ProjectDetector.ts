/**
 * ProjectDetector - Detect project type and generate Q configuration
 * 
 * Analyzes current project context to determine:
 * - Project type (Node.js, Python, CloudFormation, etc.)
 * - Appropriate Q workspace configuration
 * - Required permissions and policies
 */

import { existsSync } from "https://deno.land/std@0.208.0/fs/mod.ts";
import { join } from "https://deno.land/std@0.208.0/path/mod.ts";

export interface ProjectType {
  name: string;
  type: 'nodejs' | 'python' | 'cloudformation' | 'terraform' | 'generic';
  confidence: number;
  indicators: string[];
}

export interface QConfig {
  username: string;
  homeDirectory: string;
  workspace: string;
  gitIdentity: {
    name: string;
    email: string;
  };
  awsProfile: string;
  region: string;
  projectPath: string;
  projectType: ProjectType;
}

export class ProjectDetector {
  private currentDir: string;

  constructor(projectPath?: string) {
    this.currentDir = projectPath || Deno.cwd();
  }

  /**
   * Detect project type based on files and structure
   */
  async detect(): Promise<ProjectType> {
    const detectors = [
      this.detectNodeJS.bind(this),
      this.detectPython.bind(this),
      this.detectCloudFormation.bind(this),
      this.detectTerraform.bind(this),
    ];

    const results = await Promise.all(detectors.map(detector => detector()));
    
    // Find the detection with highest confidence
    const bestMatch = results.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );

    // If no specific type detected, return generic
    if (bestMatch.confidence === 0) {
      return {
        name: 'Generic Project',
        type: 'generic',
        confidence: 1,
        indicators: ['Directory exists']
      };
    }

    return bestMatch;
  }

  /**
   * Generate Q configuration based on project detection and no-wing config
   */
  async generateQConfig(noWingConfig?: any): Promise<QConfig> {
    const projectType = await this.detect();
    const projectName = this.getProjectName();
    
    // Generate Q-specific identifiers
    const qUsername = `q-${projectName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    // NEW: Workspace in project directory instead of /tmp for better DX
    const qHomeDir = join(this.workingDirectory, '.no-wing', 'q-home');
    const qWorkspace = join(this.workingDirectory, '.no-wing', 'workspace');

    return {
      username: qUsername,
      homeDirectory: qHomeDir,
      workspace: qWorkspace,
      gitIdentity: {
        name: 'Q Assistant',
        email: `q-assistant@${projectName.toLowerCase()}.no-wing.local`
      },
      awsProfile: noWingConfig?.credentials?.profile || 'default',
      region: noWingConfig?.region || 'us-east-1',
      projectPath: this.currentDir,
      projectType
    };
  }

  /**
   * Detect Node.js project
   */
  private async detectNodeJS(): Promise<ProjectType> {
    const indicators: string[] = [];
    let confidence = 0;

    if (existsSync(join(this.currentDir, 'package.json'))) {
      indicators.push('package.json');
      confidence += 0.8;
    }

    if (existsSync(join(this.currentDir, 'node_modules'))) {
      indicators.push('node_modules/');
      confidence += 0.3;
    }

    if (existsSync(join(this.currentDir, 'yarn.lock'))) {
      indicators.push('yarn.lock');
      confidence += 0.2;
    }

    if (existsSync(join(this.currentDir, 'package-lock.json'))) {
      indicators.push('package-lock.json');
      confidence += 0.2;
    }

    // Check for TypeScript
    if (existsSync(join(this.currentDir, 'tsconfig.json'))) {
      indicators.push('tsconfig.json');
      confidence += 0.1;
    }

    return {
      name: 'Node.js Project',
      type: 'nodejs',
      confidence: Math.min(confidence, 1),
      indicators
    };
  }

  /**
   * Detect Python project
   */
  private async detectPython(): Promise<ProjectType> {
    const indicators: string[] = [];
    let confidence = 0;

    if (existsSync(join(this.currentDir, 'requirements.txt'))) {
      indicators.push('requirements.txt');
      confidence += 0.6;
    }

    if (existsSync(join(this.currentDir, 'setup.py'))) {
      indicators.push('setup.py');
      confidence += 0.5;
    }

    if (existsSync(join(this.currentDir, 'pyproject.toml'))) {
      indicators.push('pyproject.toml');
      confidence += 0.5;
    }

    if (existsSync(join(this.currentDir, 'Pipfile'))) {
      indicators.push('Pipfile');
      confidence += 0.4;
    }

    // Check for Python files
    try {
      for await (const entry of Deno.readDir(this.currentDir)) {
        if (entry.isFile && entry.name.endsWith('.py')) {
          indicators.push('*.py files');
          confidence += 0.3;
          break;
        }
      }
    } catch {
      // Directory read failed, continue
    }

    return {
      name: 'Python Project',
      type: 'python',
      confidence: Math.min(confidence, 1),
      indicators
    };
  }

  /**
   * Detect CloudFormation project
   */
  private async detectCloudFormation(): Promise<ProjectType> {
    const indicators: string[] = [];
    let confidence = 0;

    const cfTemplateFiles = [
      'template.yaml', 'template.yml', 'template.json',
      'cloudformation.yaml', 'cloudformation.yml', 'cloudformation.json'
    ];

    for (const file of cfTemplateFiles) {
      if (existsSync(join(this.currentDir, file))) {
        indicators.push(file);
        confidence += 0.7;
        break;
      }
    }

    // Check for SAM
    if (existsSync(join(this.currentDir, 'samconfig.toml'))) {
      indicators.push('samconfig.toml');
      confidence += 0.3;
    }

    // Check for CDK
    if (existsSync(join(this.currentDir, 'cdk.json'))) {
      indicators.push('cdk.json');
      confidence += 0.5;
    }

    return {
      name: 'CloudFormation Project',
      type: 'cloudformation',
      confidence: Math.min(confidence, 1),
      indicators
    };
  }

  /**
   * Detect Terraform project
   */
  private async detectTerraform(): Promise<ProjectType> {
    const indicators: string[] = [];
    let confidence = 0;

    try {
      for await (const entry of Deno.readDir(this.currentDir)) {
        if (entry.isFile && entry.name.endsWith('.tf')) {
          indicators.push('*.tf files');
          confidence += 0.8;
          break;
        }
      }
    } catch {
      // Directory read failed, continue
    }

    if (existsSync(join(this.currentDir, 'terraform.tfvars'))) {
      indicators.push('terraform.tfvars');
      confidence += 0.2;
    }

    if (existsSync(join(this.currentDir, '.terraform'))) {
      indicators.push('.terraform/');
      confidence += 0.3;
    }

    return {
      name: 'Terraform Project',
      type: 'terraform',
      confidence: Math.min(confidence, 1),
      indicators
    };
  }

  /**
   * Get project name from directory or package.json
   */
  private getProjectName(): string {
    // Try to get name from package.json
    try {
      const packageJsonPath = join(this.currentDir, 'package.json');
      if (existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(Deno.readTextFileSync(packageJsonPath));
        if (packageJson.name) {
          return packageJson.name;
        }
      }
    } catch {
      // Failed to read package.json, continue
    }

    // Fall back to directory name
    const pathParts = this.currentDir.split('/');
    return pathParts[pathParts.length - 1] || 'unknown-project';
  }
}
