/**
 * Improved Project Detector with Better Workspace Strategy
 * 
 * Key Changes:
 * 1. Workspace in project directory instead of /tmp
 * 2. Q works on actual project with identity separation
 * 3. Better service boundary alignment
 */

import { join, basename } from "https://deno.land/std@0.208.0/path/mod.ts";

export interface ProjectContext {
  name: string;
  type: 'node' | 'python' | 'cloudformation' | 'generic';
  rootPath: string;
  hasGit: boolean;
  packageManager?: 'npm' | 'yarn' | 'pnpm' | 'pip' | 'poetry';
}

export interface QConfig {
  region: string;
  username: string;
  homeDirectory: string;
  workspace: string;
  projectPath: string;  // NEW: Actual project path
  workspaceMode: 'isolated' | 'linked';  // NEW: Workspace strategy
  gitIdentity: {
    name: string;
    email: string;
  };
  permissions: {
    requiredPolicies: string[];
    optionalPolicies: string[];
  };
}

export class ImprovedProjectDetector {
  
  /**
   * Detect project context and generate improved Q configuration
   */
  static async detectProject(workingDirectory: string = Deno.cwd()): Promise<{
    project: ProjectContext;
    qConfig: QConfig;
  }> {
    const project = await this.analyzeProject(workingDirectory);
    const qConfig = await this.generateQConfig(project, workingDirectory);
    
    return { project, qConfig };
  }

  /**
   * Generate Q configuration with improved workspace strategy
   */
  private static async generateQConfig(
    project: ProjectContext, 
    workingDirectory: string
  ): Promise<QConfig> {
    
    // Generate Q-specific identifiers
    const qUsername = `q-${project.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    
    // NEW: Workspace in project directory, not /tmp
    const qWorkspaceDir = join(workingDirectory, '.no-wing', 'workspace');
    const qHomeDir = join(workingDirectory, '.no-wing', 'q-home');
    
    // Determine workspace mode based on project type
    const workspaceMode = this.determineWorkspaceMode(project);
    
    return {
      region: 'us-east-1',
      username: qUsername,
      homeDirectory: qHomeDir,
      workspace: qWorkspaceDir,
      projectPath: workingDirectory,  // NEW: Q knows about actual project
      workspaceMode,  // NEW: Strategy for how Q interacts with project
      gitIdentity: {
        name: 'Q Assistant',
        email: `${qUsername}@no-wing.local`
      },
      permissions: this.generatePermissions(project)
    };
  }

  /**
   * Determine optimal workspace mode for project type
   */
  private static determineWorkspaceMode(project: ProjectContext): 'isolated' | 'linked' {
    // For development projects, use linked mode (Q works on actual files)
    // For sensitive projects, use isolated mode (Q works on copies)
    
    switch (project.type) {
      case 'node':
      case 'python':
        return 'linked';  // Q can work directly on source files
      case 'cloudformation':
        return 'linked';  // Q can modify templates directly
      default:
        return 'isolated';  // Conservative default
    }
  }

  /**
   * Analyze project structure and type
   */
  private static async analyzeProject(workingDirectory: string): Promise<ProjectContext> {
    const projectName = basename(workingDirectory);
    
    // Check for various project indicators
    const hasPackageJson = await this.fileExists(join(workingDirectory, 'package.json'));
    const hasRequirementsTxt = await this.fileExists(join(workingDirectory, 'requirements.txt'));
    const hasPyprojectToml = await this.fileExists(join(workingDirectory, 'pyproject.toml'));
    const hasCloudFormation = await this.hasCloudFormationFiles(workingDirectory);
    const hasGit = await this.fileExists(join(workingDirectory, '.git'));
    
    // Determine project type
    let type: ProjectContext['type'] = 'generic';
    let packageManager: ProjectContext['packageManager'] | undefined;
    
    if (hasPackageJson) {
      type = 'node';
      packageManager = await this.detectNodePackageManager(workingDirectory);
    } else if (hasRequirementsTxt || hasPyprojectToml) {
      type = 'python';
      packageManager = hasPyprojectToml ? 'poetry' : 'pip';
    } else if (hasCloudFormation) {
      type = 'cloudformation';
    }
    
    return {
      name: projectName,
      type,
      rootPath: workingDirectory,
      hasGit,
      packageManager
    };
  }

  /**
   * Generate permissions based on project type
   */
  private static generatePermissions(project: ProjectContext): {
    requiredPolicies: string[];
    optionalPolicies: string[];
  } {
    const base = {
      requiredPolicies: [] as string[],
      optionalPolicies: ['IAMReadOnlyAccess'] as string[]
    };

    switch (project.type) {
      case 'cloudformation':
        base.requiredPolicies.push('CloudFormationFullAccess');
        base.optionalPolicies.push('S3FullAccess', 'LambdaFullAccess');
        break;
      case 'node':
      case 'python':
        base.optionalPolicies.push('LambdaFullAccess', 'S3ReadOnlyAccess');
        break;
    }

    return base;
  }

  // Helper methods
  private static async fileExists(path: string): Promise<boolean> {
    try {
      await Deno.stat(path);
      return true;
    } catch {
      return false;
    }
  }

  private static async hasCloudFormationFiles(dir: string): Promise<boolean> {
    try {
      for await (const entry of Deno.readDir(dir)) {
        if (entry.isFile && (
          entry.name.endsWith('.yaml') || 
          entry.name.endsWith('.yml') ||
          entry.name.endsWith('.template') ||
          entry.name.includes('cloudformation') ||
          entry.name.includes('template')
        )) {
          return true;
        }
      }
    } catch {
      // Directory not readable
    }
    return false;
  }

  private static async detectNodePackageManager(dir: string): Promise<'npm' | 'yarn' | 'pnpm'> {
    if (await this.fileExists(join(dir, 'pnpm-lock.yaml'))) return 'pnpm';
    if (await this.fileExists(join(dir, 'yarn.lock'))) return 'yarn';
    return 'npm';
  }
}
