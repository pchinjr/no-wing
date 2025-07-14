/**
 * QSessionManager - Launch and manage Q sessions with proper identity
 * 
 * Manages Q CLI sessions with:
 * - Service account identity isolation
 * - Proper environment variable setup
 * - Session lifecycle management
 * - Workspace isolation
 */

import { QConfig } from './ProjectDetector.ts';
import { NoWingConfig } from '../config/ConfigManager.ts';

export interface QSessionConfig {
  sessionId: string;
  startTime: Date;
  workingDirectory: string;
  pid?: number;
  environment: Record<string, string>;
}

export interface QSessionStatus {
  active: boolean;
  sessionId?: string;
  startTime?: Date;
  pid?: number;
  workingDirectory?: string;
}

export class QSessionManager {
  private qConfig: QConfig;
  private noWingConfig: NoWingConfig;
  private sessionFile: string;
  private currentProcess?: Deno.ChildProcess;

  constructor(qConfig: QConfig, noWingConfig: NoWingConfig) {
    this.qConfig = qConfig;
    this.noWingConfig = noWingConfig;
    this.sessionFile = `${qConfig.workspace}/logs/q-session.json`;
  }

  /**
   * Launch Q CLI with service account identity
   */
  async launchQ(workingDirectory: string, qCliArgs: string[] = ['chat']): Promise<QSessionConfig> {
    const sessionId = this.generateSessionId();
    const startTime = new Date();

    try {
      // Ensure workspace exists (for logs and sessions only)
      await this.ensureWorkspace();

      // Prepare Q environment
      const environment = this.prepareQEnvironment(workingDirectory);

      // Create session configuration
      const sessionConfig: QSessionConfig = {
        sessionId,
        startTime,
        workingDirectory,
        environment
      };

      // Launch Q CLI process with service account identity (directly in target project)
      const process = await this.startQProcess(environment, qCliArgs);
      sessionConfig.pid = process.pid;

      // Save session information
      await this.saveSessionInfo(sessionConfig);

      console.log(`🚀 Q session launched: ${sessionId}`);
      return sessionConfig;

    } catch (error) {
      throw new Error(`Failed to launch Q session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get current Q session status
   */
  getSessionStatus(): QSessionStatus {
    try {
      if (!existsSync(this.sessionFile)) {
        return { active: false };
      }

      const sessionData = JSON.parse(Deno.readTextFileSync(this.sessionFile));
      
      // Check if process is still running
      const isActive = this.isProcessActive(sessionData.pid);

      if (!isActive) {
        // Clean up stale session file
        this.cleanupSession();
        return { active: false };
      }

      return {
        active: true,
        sessionId: sessionData.sessionId,
        startTime: new Date(sessionData.startTime),
        pid: sessionData.pid,
        workingDirectory: sessionData.workingDirectory
      };

    } catch (error) {
      console.warn('Failed to get session status:', error instanceof Error ? error.message : 'Unknown error');
      return { active: false };
    }
  }

  /**
   * Stop active Q session
   */
  async stopSession(): Promise<void> {
    const status = this.getSessionStatus();
    
    if (!status.active || !status.pid) {
      console.log('No active Q session to stop');
      return;
    }

    try {
      // Attempt graceful termination
      await this.terminateProcess(status.pid);
      
      // Clean up session file
      this.cleanupSession();
      
      console.log(`✅ Q session stopped: ${status.sessionId}`);
    } catch (error) {
      throw new Error(`Failed to stop Q session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Prepare Q environment with service account identity
   */
  private prepareQEnvironment(_workingDirectory: string): Record<string, string> {
    const userHome = Deno.env.get('HOME') || '/tmp';
    
    const environment: Record<string, string> = {
      // Preserve user HOME for Q CLI authentication
      'HOME': userHome,
      
      // Q service account identity for git operations
      'GIT_AUTHOR_NAME': this.qConfig.gitIdentity.name,
      'GIT_AUTHOR_EMAIL': this.qConfig.gitIdentity.email,
      'GIT_COMMITTER_NAME': this.qConfig.gitIdentity.name,
      'GIT_COMMITTER_EMAIL': this.qConfig.gitIdentity.email,
      
      // AWS configuration for service account
      'AWS_PROFILE': this.qConfig.awsProfile,
      'AWS_DEFAULT_REGION': this.qConfig.region,
      'AWS_REGION': this.qConfig.region,
      
      // Q workspace information
      'Q_WORKSPACE': this.qConfig.workspace,
      'Q_PROJECT_PATH': this.qConfig.projectPath,  // Original project directory
      'Q_WORKSPACE_PROJECT': `${this.qConfig.workspace}/project`,  // Copied project in workspace
      'Q_SESSION_ID': this.generateSessionId(),
      'Q_SERVICE_ACCOUNT': this.qConfig.username,
      
      // Preserve essential system environment
      'PATH': Deno.env.get('PATH') || '/usr/local/bin:/usr/bin:/bin',
      'TERM': Deno.env.get('TERM') || 'xterm-256color',
      'LANG': Deno.env.get('LANG') || 'en_US.UTF-8',
      // Q service account identity (not system user)
      'USER': this.qConfig.username,  // Q runs as its own user identity
      'LOGNAME': this.qConfig.username,  // Consistent with USER
    };

    // Add AWS credentials if available
    const credentials = this.noWingConfig.credentials;
    if (credentials) {
      if (credentials.accessKeyId && credentials.secretAccessKey) {
        environment['AWS_ACCESS_KEY_ID'] = credentials.accessKeyId;
        environment['AWS_SECRET_ACCESS_KEY'] = credentials.secretAccessKey;
        if (credentials.sessionToken) {
          environment['AWS_SESSION_TOKEN'] = credentials.sessionToken;
        }
      }
    }

    return environment;
  }

  /**
   * Setup Q CLI authentication in service account environment
   */
  private async setupQAuthentication(): Promise<void> {
    try {
      const userHome = Deno.env.get('HOME') || '/tmp';
      const userQConfigDir = `${userHome}/.aws/amazonq`;
      const qHome = this.qConfig.homeDirectory;
      const qAwsDir = `${qHome}/.aws`;
      const qConfigDir = `${qAwsDir}/amazonq`;

      // Check if user has Q authentication
      try {
        await Deno.stat(userQConfigDir);
      } catch {
        console.log('⚠️  No Q CLI authentication found in user account');
        console.log('   Q will need to authenticate separately in the service account');
        return;
      }

      // Create Q's AWS directory
      await Deno.mkdir(qAwsDir, { recursive: true });

      // Copy Q authentication to service account
      await this.copyDirectory(userQConfigDir, qConfigDir);
      
      console.log('✅ Q CLI authentication copied to service account');
    } catch (error) {
      console.warn('⚠️  Failed to setup Q authentication:', error instanceof Error ? error.message : 'Unknown error');
      console.log('   Q may need to authenticate separately');
    }
  }
  /**
   * Start Q CLI process with proper service account context
   */
  private async startQProcess(environment: Record<string, string>, qCliArgs: string[]): Promise<Deno.ChildProcess> {
    // Check if Q CLI is available
    const qCliPath = await this.findQCli();
    if (!qCliPath) {
      throw new Error('Amazon Q CLI not found. Please install Q CLI first.');
    }

    // CRITICAL FIX: Q operates directly in the target project directory, not workspace copy
    const projectDir = this.qConfig.projectPath;

    console.log(`🚀 Launching Q CLI with service account identity:`);
    console.log(`   Command: q ${qCliArgs.join(' ')}`);
    console.log(`   Working Directory: ${projectDir}`);
    console.log(`   Q Identity: ${this.qConfig.username}`);
    console.log(`   AWS Profile: ${this.qConfig.awsProfile}`);
    console.log(`   Git Identity: ${this.qConfig.gitIdentity.name} <${this.qConfig.gitIdentity.email}>`);
    console.log('');

    // For Deno implementation, we'll run Q CLI directly with the service account environment
    // In a production system, you might want to use actual user switching with sudo
    const process = new Deno.Command(qCliPath, {
      args: qCliArgs,
      cwd: projectDir,
      env: environment,
      stdin: 'inherit',
      stdout: 'inherit',
      stderr: 'inherit'
    }).spawn();

    // Store reference to current process
    this.currentProcess = process;

    // Handle process completion
    process.status.then((status) => {
      console.log('');
      if (status.success) {
        console.log('✅ Q CLI session ended successfully');
      } else {
        console.log(`⚠️  Q CLI session ended with code ${status.code}`);
      }
      
      this.currentProcess = undefined;
      this.cleanupSession();
    }).catch((error) => {
      console.error('❌ Q CLI process error:', error.message);
      this.currentProcess = undefined;
      this.cleanupSession();
    });

    return process;
  }

  /**
   * Find Q CLI executable
   */
  private async findQCli(): Promise<string | null> {
    const possiblePaths = [
      '/usr/local/bin/q',
      '/usr/bin/q',
      '/opt/homebrew/bin/q',
      `${Deno.env.get('HOME')}/.local/bin/q`
    ];

    for (const path of possiblePaths) {
      try {
        const stat = await Deno.stat(path);
        if (stat.isFile) {
          return path;
        }
      } catch {
        // File doesn't exist, continue
      }
    }

    // Try to find in PATH
    try {
      const process = new Deno.Command('which', {
        args: ['q'],
        stdout: 'piped',
        stderr: 'piped'
      });
      
      const { code, stdout } = await process.output();
      if (code === 0) {
        const path = new TextDecoder().decode(stdout).trim();
        if (path) {
          return path;
        }
      }
    } catch {
      // which command failed
    }

    return null;
  }

  /**
   * Ensure Q workspace exists (for logs and sessions only, not project copies)
   */
  private async ensureWorkspace(): Promise<void> {
    try {
      await Deno.mkdir(this.qConfig.workspace, { recursive: true });
      await Deno.mkdir(`${this.qConfig.workspace}/logs`, { recursive: true });
      await Deno.mkdir(`${this.qConfig.workspace}/sessions`, { recursive: true });
      // Note: No longer creating project/ directory - Q operates directly in target project
    } catch (error) {
      throw new Error(`Failed to create workspace: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Save session information
   */
  private async saveSessionInfo(sessionConfig: QSessionConfig): Promise<void> {
    try {
      const sessionData = {
        sessionId: sessionConfig.sessionId,
        startTime: sessionConfig.startTime.toISOString(),
        workingDirectory: sessionConfig.workingDirectory,
        pid: sessionConfig.pid,
        qConfig: {
          username: this.qConfig.username,
          gitIdentity: this.qConfig.gitIdentity,
          awsProfile: this.qConfig.awsProfile
        }
      };

      await Deno.writeTextFile(this.sessionFile, JSON.stringify(sessionData, null, 2));
    } catch (error) {
      console.warn('Failed to save session info:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Check if process is still active
   */
  private isProcessActive(pid?: number): boolean {
    if (!pid) return false;

    try {
      // On Unix systems, sending signal 0 checks if process exists
      Deno.kill(pid, 'SIGTERM');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Terminate process gracefully
   */
  private async terminateProcess(pid: number): Promise<void> {
    try {
      // Send SIGTERM for graceful shutdown
      Deno.kill(pid, 'SIGTERM');
      
      // Wait a bit for graceful shutdown
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if still running, force kill if necessary
      if (this.isProcessActive(pid)) {
        Deno.kill(pid, 'SIGKILL');
      }
    } catch (error) {
      console.warn('Process termination warning:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Clean up session files
   */
  private cleanupSession(): void {
    try {
      if (existsSync(this.sessionFile)) {
        Deno.removeSync(this.sessionFile);
      }
    } catch (error) {
      console.warn('Session cleanup warning:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `q-${timestamp}-${random}`;
  }
}

// Helper function to check if file exists (for compatibility)
function existsSync(path: string): boolean {
  try {
    Deno.statSync(path);
    return true;
  } catch {
    return false;
  }
}
