/**
 * Q Identity and Capability Management System
 * 
 * Manages Q's progressive capabilities and tracks advancement through levels:
 * Observer → Assistant → Partner
 */

export enum QCapabilityLevel {
  OBSERVER = 'observer',
  ASSISTANT = 'assistant', 
  PARTNER = 'partner'
}

export interface QIdentity {
  id: string;
  name: string;
  level: QCapabilityLevel;
  createdAt: string;
  lastActive: string;
  sessionExpiry: string;
  successfulTasks: number;
  failedTasks: number;
  permissions: string[];
  awsRoleArn?: string;
  githubToken?: string;
}

export interface QTask {
  id: string;
  type: string;
  description: string;
  requiredLevel: QCapabilityLevel;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  result?: any;
  error?: string;
}

export class QIdentityManager {
  private configPath: string;
  private identity: QIdentity | null = null;

  constructor(configPath: string = './.no-wing/q-identity.json') {
    this.configPath = configPath;
  }

  /**
   * Create a new Q identity with Observer level capabilities
   */
  async createIdentity(name: string = 'Q'): Promise<QIdentity> {
    const now = new Date().toISOString();
    const sessionExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
    
    const identity: QIdentity = {
      id: this.generateId(),
      name,
      level: QCapabilityLevel.OBSERVER,
      createdAt: now,
      lastActive: now,
      sessionExpiry,
      successfulTasks: 0,
      failedTasks: 0,
      permissions: this.getPermissionsForLevel(QCapabilityLevel.OBSERVER)
    };

    await this.saveIdentity(identity);
    this.identity = identity;
    return identity;
  }

  /**
   * Load existing Q identity from config
   */
  async loadIdentity(): Promise<QIdentity | null> {
    try {
      const fs = await import('fs/promises');
      const data = await fs.readFile(this.configPath, 'utf-8');
      const identity = JSON.parse(data) as QIdentity;
      
      // Check session expiry
      if (this.isSessionExpired(identity)) {
        console.log('Q session expired, requiring re-authentication');
        return null;
      }
      
      // Update last active time and refresh session
      identity.lastActive = new Date().toISOString();
      identity.sessionExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      await this.saveIdentity(identity);
      
      this.identity = identity;
      return identity;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if Q session has expired
   */
  private isSessionExpired(identity: QIdentity): boolean {
    if (!identity.sessionExpiry) {
      // Legacy identity without expiry - consider expired after 24 hours of inactivity
      const lastActive = new Date(identity.lastActive);
      const now = new Date();
      const hoursSinceActive = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);
      return hoursSinceActive > 24;
    }
    
    const now = new Date();
    const expiry = new Date(identity.sessionExpiry);
    return now > expiry;
  }

  /**
   * Get current Q identity
   */
  getIdentity(): QIdentity | null {
    return this.identity;
  }

  /**
   * Check if Q can perform a specific task
   */
  canPerformTask(taskType: string, requiredLevel: QCapabilityLevel): boolean {
    if (!this.identity) return false;
    
    const levelOrder = [QCapabilityLevel.OBSERVER, QCapabilityLevel.ASSISTANT, QCapabilityLevel.PARTNER];
    const currentLevelIndex = levelOrder.indexOf(this.identity.level);
    const requiredLevelIndex = levelOrder.indexOf(requiredLevel);
    
    return currentLevelIndex >= requiredLevelIndex;
  }

  /**
   * Record successful task completion and check for level advancement
   */
  async recordTaskSuccess(task: QTask): Promise<boolean> {
    if (!this.identity) return false;

    this.identity.successfulTasks++;
    this.identity.lastActive = new Date().toISOString();

    // Check for level advancement
    const advanced = await this.checkLevelAdvancement();
    
    await this.saveIdentity(this.identity);
    return advanced;
  }

  /**
   * Record failed task
   */
  async recordTaskFailure(task: QTask): Promise<void> {
    if (!this.identity) return;

    this.identity.failedTasks++;
    this.identity.lastActive = new Date().toISOString();
    
    await this.saveIdentity(this.identity);
  }

  /**
   * Check if Q should advance to the next capability level
   */
  private async checkLevelAdvancement(): Promise<boolean> {
    if (!this.identity) return false;

    const currentLevel = this.identity.level;
    let shouldAdvance = false;

    switch (currentLevel) {
      case QCapabilityLevel.OBSERVER:
        // Advance to Assistant after 3 successful observations
        if (this.identity.successfulTasks >= 3) {
          this.identity.level = QCapabilityLevel.ASSISTANT;
          shouldAdvance = true;
        }
        break;
      
      case QCapabilityLevel.ASSISTANT:
        // Advance to Partner after 5 successful assists (total 8)
        if (this.identity.successfulTasks >= 8) {
          this.identity.level = QCapabilityLevel.PARTNER;
          shouldAdvance = true;
        }
        break;
      
      case QCapabilityLevel.PARTNER:
        // Already at max level
        break;
    }

    if (shouldAdvance) {
      this.identity.permissions = this.getPermissionsForLevel(this.identity.level);
      console.log(`🎉 Q has advanced to ${this.identity.level.toUpperCase()} level!`);
    }

    return shouldAdvance;
  }

  /**
   * Get permissions for a specific capability level
   */
  private getPermissionsForLevel(level: QCapabilityLevel): string[] {
    switch (level) {
      case QCapabilityLevel.OBSERVER:
        return [
          'lambda:GetFunction',
          'lambda:ListFunctions',
          'logs:DescribeLogGroups',
          'logs:DescribeLogStreams',
          'logs:GetLogEvents',
          'cloudformation:DescribeStacks',
          'cloudformation:ListStacks'
        ];
      
      case QCapabilityLevel.ASSISTANT:
        return [
          ...this.getPermissionsForLevel(QCapabilityLevel.OBSERVER),
          'lambda:UpdateFunctionConfiguration',
          'lambda:UpdateFunctionCode',
          'lambda:TagResource',
          'lambda:UntagResource',
          's3:GetObject',
          's3:PutObject'
        ];
      
      case QCapabilityLevel.PARTNER:
        return [
          ...this.getPermissionsForLevel(QCapabilityLevel.ASSISTANT),
          'lambda:CreateFunction',
          'lambda:DeleteFunction',
          'iam:CreateRole',
          'iam:AttachRolePolicy',
          'iam:DetachRolePolicy',
          'cloudformation:CreateStack',
          'cloudformation:UpdateStack',
          'cloudformation:DeleteStack'
        ];
      
      default:
        return [];
    }
  }

  /**
   * Save identity to config file
   */
  private async saveIdentity(identity: QIdentity): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    // Ensure directory exists
    const dir = path.dirname(this.configPath);
    await fs.mkdir(dir, { recursive: true });
    
    await fs.writeFile(this.configPath, JSON.stringify(identity, null, 2));
  }

  /**
   * Generate unique ID for Q
   */
  private generateId(): string {
    return `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
