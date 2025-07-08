/**
 * QSessionManager - Launch and manage Q sessions with service account identity
 */

import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import type { QServiceAccountConfig } from './ProjectDetector.js';

export interface QSessionConfig {
  qConfig: QServiceAccountConfig;
  workingDirectory: string;
  sessionId: string;
  startTime: Date;
}

export interface QSessionStatus {
  active: boolean;
  sessionId?: string;
  startTime?: Date;
  pid?: number;
  workingDirectory?: string;
}

export class QSessionManager {
  private config: QServiceAccountConfig;
  private currentSession?: QSessionConfig;
  private qProcess?: ChildProcess;

  constructor(config: QServiceAccountConfig) {
    this.config = config;
  }

  /**
   * Launch Q with service account identity
   */
  async launchQ(workingDirectory: string = process.cwd(), qCliArgs?: string[]): Promise<QSessionConfig> {
    // Validate service account exists and is healthy
    await this.validateServiceAccount();

    // Generate session ID
    const sessionId = this.generateSessionId();
    const startTime = new Date();

    // Create session configuration
    const sessionConfig: QSessionConfig = {
      qConfig: this.config,
      workingDirectory,
      sessionId,
      startTime
    };

    // Setup Q environment
    await this.setupQEnvironment(sessionConfig);

    // Log session start
    await this.logSessionStart(sessionConfig);

    // Launch Q process with service account context
    await this.startQProcess(sessionConfig);

    this.currentSession = sessionConfig;
    return sessionConfig;
  }

  /**
   * Get current Q session status
   */
  getSessionStatus(): QSessionStatus {
    if (!this.currentSession || !this.qProcess) {
      return { active: false };
    }

    return {
      active: !this.qProcess.killed && this.qProcess.exitCode === null,
      sessionId: this.currentSession.sessionId,
      startTime: this.currentSession.startTime,
      pid: this.qProcess.pid,
      workingDirectory: this.currentSession.workingDirectory
    };
  }

  /**
   * Stop current Q session
   */
  async stopSession(): Promise<void> {
    if (!this.currentSession || !this.qProcess) {
      return;
    }

    // Log session end
    await this.logSessionEnd(this.currentSession);

    // Gracefully terminate Q process
    if (!this.qProcess.killed) {
      this.qProcess.kill('SIGTERM');
      
      // Wait for graceful shutdown, then force kill if needed
      setTimeout(() => {
        if (this.qProcess && !this.qProcess.killed) {
          this.qProcess.kill('SIGKILL');
        }
      }, 5000);
    }

    this.currentSession = undefined;
    this.qProcess = undefined;
  }

  /**
   * Validate that service account exists and is healthy
   */
  private async validateServiceAccount(): Promise<void> {
    // Check if Q user exists
    const userExists = await this.checkQUserExists();
    if (!userExists) {
      throw new Error(`Q service account ${this.config.username} does not exist. Run 'no-wing setup' first.`);
    }

    // Check if home directory exists
    try {
      await fs.access(this.config.homeDirectory);
    } catch {
      throw new Error(`Q home directory ${this.config.homeDirectory} does not exist.`);
    }

    // Check if workspace exists
    try {
      await fs.access(this.config.workspace);
    } catch {
      throw new Error(`Q workspace ${this.config.workspace} does not exist.`);
    }
  }

  /**
   * Setup Q environment for the session
   */
  private async setupQEnvironment(sessionConfig: QSessionConfig): Promise<void> {
    // Create session directory in Q's workspace
    const sessionDir = path.join(this.config.workspace, 'sessions', sessionConfig.sessionId);
    await fs.mkdir(sessionDir, { recursive: true });

    // Copy current project to Q's workspace if needed
    const projectDir = path.join(this.config.workspace, 'project');
    await this.syncProjectToQWorkspace(sessionConfig.workingDirectory, projectDir);

    // Set up environment variables for Q
    await this.createQEnvironmentFile(sessionConfig, sessionDir);
  }

  /**
   * Sync current project to Q's workspace
   */
  private async syncProjectToQWorkspace(sourceDir: string, targetDir: string): Promise<void> {
    // Create target directory
    await fs.mkdir(targetDir, { recursive: true });

    // For now, we'll create a simple sync - in production this could be more sophisticated
    // Copy essential files (avoiding node_modules, .git, etc.)
    const filesToSync = [
      'package.json',
      'template.yaml', 'template.yml',
      'cdk.json',
      'serverless.yml', 'serverless.yaml',
      'tsconfig.json',
      'README.md'
    ];

    for (const file of filesToSync) {
      const sourcePath = path.join(sourceDir, file);
      const targetPath = path.join(targetDir, file);
      
      try {
        await fs.access(sourcePath);
        await fs.copyFile(sourcePath, targetPath);
      } catch {
        // File doesn't exist, skip
      }
    }

    // Create a marker file indicating this is Q's copy
    const markerContent = [
      '# Q Assistant Project Copy',
      `# Original: ${sourceDir}`,
      `# Copied: ${new Date().toISOString()}`,
      `# Session: ${this.currentSession?.sessionId}`,
      '',
      'This is Q Assistant\'s working copy of your project.',
      'Q operates in this isolated workspace with its own identity.'
    ].join('\n');

    await fs.writeFile(path.join(targetDir, '.q-workspace'), markerContent);
  }

  /**
   * Create environment file for Q session
   */
  private async createQEnvironmentFile(sessionConfig: QSessionConfig, sessionDir: string): Promise<void> {
    const envContent = [
      '# Q Assistant Environment',
      `# Session: ${sessionConfig.sessionId}`,
      `# Started: ${sessionConfig.startTime.toISOString()}`,
      '',
      `HOME=${this.config.homeDirectory}`,
      `USER=${this.config.username}`,
      `AWS_PROFILE=${this.config.awsProfile}`,
      `GIT_AUTHOR_NAME="${this.config.gitIdentity.name}"`,
      `GIT_AUTHOR_EMAIL="${this.config.gitIdentity.email}"`,
      `GIT_COMMITTER_NAME="${this.config.gitIdentity.name}"`,
      `GIT_COMMITTER_EMAIL="${this.config.gitIdentity.email}"`,
      `Q_SESSION_ID=${sessionConfig.sessionId}`,
      `Q_WORKSPACE=${this.config.workspace}`,
      `Q_PROJECT_DIR=${path.join(this.config.workspace, 'project')}`,
      ''
    ].join('\n');

    await fs.writeFile(path.join(sessionDir, 'q-environment'), envContent);
  }

  /**
   * Start Q process with service account context
   */
  private async startQProcess(sessionConfig: QSessionConfig): Promise<void> {
    const sessionDir = path.join(this.config.workspace, 'sessions', sessionConfig.sessionId);
    const envFile = path.join(sessionDir, 'q-environment');
    const projectDir = path.join(this.config.workspace, 'project');

    // For now, we'll simulate launching Q by creating a shell session
    // In production, this would launch the actual Amazon Q CLI or interface
    this.qProcess = spawn('sudo', [
      '-u', this.config.username,
      '-i',
      'bash', '-c',
      `source ${envFile} && cd ${projectDir} && echo "Q Assistant session started as ${this.config.username}" && bash`
    ], {
      stdio: 'inherit',
      env: {
        ...process.env,
        HOME: this.config.homeDirectory,
        USER: this.config.username,
        AWS_PROFILE: this.config.awsProfile
      }
    });

    this.qProcess.on('exit', async (code) => {
      await this.logSessionEnd(sessionConfig, code);
      this.currentSession = undefined;
      this.qProcess = undefined;
    });

    this.qProcess.on('error', (error) => {
      console.error('Q process error:', error);
    });
  }

  /**
   * Check if Q user exists
   */
  private async checkQUserExists(): Promise<boolean> {
    return new Promise((resolve) => {
      const checkUser = spawn('id', [this.config.username]);
      checkUser.on('close', (code) => {
        resolve(code === 0);
      });
      checkUser.on('error', () => {
        resolve(false);
      });
    });
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `q-${timestamp}-${random}`;
  }

  /**
   * Log session start
   */
  private async logSessionStart(sessionConfig: QSessionConfig): Promise<void> {
    const logEntry = {
      timestamp: sessionConfig.startTime.toISOString(),
      event: 'session_start',
      sessionId: sessionConfig.sessionId,
      user: this.config.username,
      project: this.config.projectName,
      workingDirectory: sessionConfig.workingDirectory,
      gitIdentity: this.config.gitIdentity,
      awsProfile: this.config.awsProfile
    };

    await this.writeAuditLog(logEntry);
  }

  /**
   * Log session end
   */
  private async logSessionEnd(sessionConfig: QSessionConfig, exitCode?: number | null): Promise<void> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event: 'session_end',
      sessionId: sessionConfig.sessionId,
      user: this.config.username,
      project: this.config.projectName,
      duration: Date.now() - sessionConfig.startTime.getTime(),
      exitCode: exitCode || 0
    };

    await this.writeAuditLog(logEntry);
  }

  /**
   * Write audit log entry
   */
  private async writeAuditLog(entry: any): Promise<void> {
    const logDir = path.join(this.config.homeDirectory, '.no-wing', 'logs');
    const logFile = path.join(logDir, 'q-sessions.log');

    await fs.mkdir(logDir, { recursive: true });
    
    const logLine = JSON.stringify(entry) + '\n';
    await fs.appendFile(logFile, logLine);
  }

  /**
   * Get session configuration
   */
  getCurrentSession(): QSessionConfig | undefined {
    return this.currentSession;
  }
}
