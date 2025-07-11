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

  constructor(qConfig: QConfig, noWingConfig: NoWingConfig) {
    this.qConfig = qConfig;
    this.noWingConfig = noWingConfig;
    this.sessionFile = `${qConfig.workspace}/logs/q-session.json`;
  }

  /**
   * Launch Q CLI with service account identity
   */
  async launchQ(workingDirectory: string): Promise<QSessionConfig> {
    const sessionId = this.generateSessionId();
    const startTime = new Date();

    try {
      // Ensure workspace exists
      await this.ensureWorkspace();

      // Prepare Q environment
      const environment = await this.prepareQEnvironment(workingDirectory);

      // Create session configuration
      const sessionConfig: QSessionConfig = {
        sessionId,
        startTime,
        workingDirectory,
        environment
      };

      // Launch Q CLI process
      const process = await this.startQProcess(environment, workingDirectory);
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
  private async prepareQEnvironment(workingDirectory: string): Promise<Record<string, string>> {
    const environment: Record<string, string> = {
      // Q identity environment
      'HOME': this.qConfig.homeDirectory,
      'USER': this.qConfig.username,
      'LOGNAME': this.qConfig.username,
      
      // AWS configuration
      'AWS_PROFILE': this.qConfig.awsProfile,
      'AWS_DEFAULT_REGION': this.qConfig.region,
      'AWS_REGION': this.qConfig.region,
      
      // Git configuration
      'GIT_AUTHOR_NAME': this.qConfig.gitIdentity.name,
      'GIT_AUTHOR_EMAIL': this.qConfig.gitIdentity.email,
      'GIT_COMMITTER_NAME': this.qConfig.gitIdentity.name,
      'GIT_COMMITTER_EMAIL': this.qConfig.gitIdentity.email,
      
      // Q workspace
      'Q_WORKSPACE': this.qConfig.workspace,
      'Q_PROJECT_PATH': workingDirectory,
      'Q_SESSION_ID': this.generateSessionId(),
      
      // Preserve essential system environment
      'PATH': Deno.env.get('PATH') || '/usr/local/bin:/usr/bin:/bin',
      'TERM': Deno.env.get('TERM') || 'xterm-256color',
      'LANG': Deno.env.get('LANG') || 'en_US.UTF-8',
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
   * Start Q CLI process with proper environment
   */
  private async startQProcess(environment: Record<string, string>, workingDirectory: string): Promise<Deno.ChildProcess> {
    // Check if Q CLI is available
    const qCliPath = await this.findQCli();
    if (!qCliPath) {
      throw new Error('Amazon Q CLI not found. Please install Q CLI first.');
    }

    console.log(`🔧 Starting Q CLI: ${qCliPath}`);
    console.log(`📂 Working directory: ${workingDirectory}`);
    console.log(`🏠 Q Home: ${environment.HOME}`);
    console.log(`👤 Q Identity: ${environment.GIT_AUTHOR_NAME} <${environment.GIT_AUTHOR_EMAIL}>`);

    // Launch Q CLI in interactive mode
    const process = new Deno.Command(qCliPath, {
      args: ['chat'],
      cwd: workingDirectory,
      env: environment,
      stdin: 'inherit',
      stdout: 'inherit',
      stderr: 'inherit'
    }).spawn();

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
   * Ensure Q workspace exists
   */
  private async ensureWorkspace(): Promise<void> {
    try {
      await Deno.mkdir(this.qConfig.workspace, { recursive: true });
      await Deno.mkdir(`${this.qConfig.workspace}/logs`, { recursive: true });
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
