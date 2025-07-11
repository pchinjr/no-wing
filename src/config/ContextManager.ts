/**
 * ContextManager - Smart context detection for project-aware configuration
 * 
 * Determines whether to use:
 * - Project-specific config: ./project/.no-wing/
 * - Global config: ~/.no-wing/
 */

export interface ProjectContext {
  configDirectory: string;
  isProjectSpecific: boolean;
  projectPath?: string;
}

export class ContextManager {
  /**
   * Detect the appropriate configuration context
   * Priority:
   * 1. Current directory has .no-wing/ -> use project-specific
   * 2. Setup command -> create in current directory  
   * 3. Otherwise -> use global home directory
   */
  detectContext(): ProjectContext {
    const currentDir = Deno.cwd();
    const projectConfigDir = `${currentDir}/.no-wing`;
    const homeDir = Deno.env.get('HOME') || Deno.env.get('USERPROFILE') || '/tmp';
    const globalConfigDir = `${homeDir}/.no-wing`;

    // Check if current directory has .no-wing/
    if (this.directoryExists(projectConfigDir)) {
      return {
        configDirectory: projectConfigDir,
        isProjectSpecific: true,
        projectPath: currentDir
      };
    }

    // If running setup command, create in current directory
    if (this.isSetupCommand()) {
      return {
        configDirectory: projectConfigDir,
        isProjectSpecific: true,
        projectPath: currentDir
      };
    }

    // Default to global configuration
    return {
      configDirectory: globalConfigDir,
      isProjectSpecific: false
    };
  }

  /**
   * Check if a directory exists
   */
  private directoryExists(path: string): boolean {
    try {
      const stat = Deno.statSync(path);
      return stat.isDirectory;
    } catch {
      return false;
    }
  }

  /**
   * Check if current command is setup
   */
  private isSetupCommand(): boolean {
    return Deno.args.includes('setup');
  }

  /**
   * Ensure configuration directory exists
   */
  async ensureConfigDirectory(configDir: string): Promise<void> {
    try {
      await Deno.mkdir(configDir, { recursive: true });
    } catch (error) {
      if (!(error instanceof Deno.errors.AlreadyExists)) {
        throw new Error(`Failed to create config directory: ${error.message}`);
      }
    }
  }

  /**
   * Get friendly description of current context
   */
  getContextDescription(context: ProjectContext): string {
    if (context.isProjectSpecific) {
      return `Project-specific (${context.projectPath})`;
    }
    return 'Global configuration';
  }
}
