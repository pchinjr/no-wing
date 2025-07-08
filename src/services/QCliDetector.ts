/**
 * QCliDetector - Detect and validate Amazon Q CLI availability
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';

export interface QCliInfo {
  available: boolean;
  version?: string;
  path?: string;
  error?: string;
}

export interface QCliCompatibility {
  compatible: boolean;
  version: string;
  minVersion: string;
  issues?: string[];
}

export class QCliDetector {
  private static readonly MIN_Q_VERSION = '1.0.0'; // Minimum supported Q CLI version
  private static readonly Q_COMMAND = 'q';

  /**
   * Detect if Q CLI is available on the system
   */
  async detectQCli(): Promise<QCliInfo> {
    try {
      // Check if Q CLI command exists
      const qPath = await this.findQCommand();
      if (!qPath) {
        return {
          available: false,
          error: 'Q CLI command not found in PATH'
        };
      }

      // Get Q CLI version
      const version = await this.getQVersion();
      if (!version) {
        return {
          available: true,
          path: qPath,
          error: 'Could not determine Q CLI version'
        };
      }

      return {
        available: true,
        version,
        path: qPath
      };

    } catch (error) {
      return {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error detecting Q CLI'
      };
    }
  }

  /**
   * Check Q CLI compatibility with no-wing
   */
  async checkCompatibility(): Promise<QCliCompatibility> {
    const qInfo = await this.detectQCli();
    
    if (!qInfo.available || !qInfo.version) {
      return {
        compatible: false,
        version: 'unknown',
        minVersion: QCliDetector.MIN_Q_VERSION,
        issues: [qInfo.error || 'Q CLI not available']
      };
    }

    const issues: string[] = [];
    
    // Check version compatibility
    const isVersionCompatible = this.isVersionCompatible(qInfo.version, QCliDetector.MIN_Q_VERSION);
    if (!isVersionCompatible) {
      issues.push(`Q CLI version ${qInfo.version} is below minimum required version ${QCliDetector.MIN_Q_VERSION}`);
    }

    // Check for required Q CLI features
    const hasRequiredFeatures = await this.checkRequiredFeatures();
    if (!hasRequiredFeatures) {
      issues.push('Q CLI missing required features for no-wing integration');
    }

    return {
      compatible: issues.length === 0,
      version: qInfo.version,
      minVersion: QCliDetector.MIN_Q_VERSION,
      issues: issues.length > 0 ? issues : undefined
    };
  }

  /**
   * Get detailed Q CLI information for troubleshooting
   */
  async getDetailedInfo(): Promise<{
    qInfo: QCliInfo;
    compatibility: QCliCompatibility;
    systemInfo: {
      platform: string;
      arch: string;
      nodeVersion: string;
    };
  }> {
    const qInfo = await this.detectQCli();
    const compatibility = await this.checkCompatibility();
    
    return {
      qInfo,
      compatibility,
      systemInfo: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version
      }
    };
  }

  /**
   * Find Q CLI command in PATH
   */
  private async findQCommand(): Promise<string | null> {
    return new Promise((resolve) => {
      const which = spawn(process.platform === 'win32' ? 'where' : 'which', [QCliDetector.Q_COMMAND]);
      let output = '';
      
      which.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      which.on('close', (code) => {
        if (code === 0 && output.trim()) {
          resolve(output.trim().split('\n')[0]); // Return first path found
        } else {
          resolve(null);
        }
      });
      
      which.on('error', () => {
        resolve(null);
      });
    });
  }

  /**
   * Get Q CLI version
   */
  private async getQVersion(): Promise<string | null> {
    return new Promise((resolve) => {
      const qVersion = spawn(QCliDetector.Q_COMMAND, ['--version']);
      let output = '';
      
      qVersion.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      qVersion.stderr.on('data', (data) => {
        output += data.toString();
      });
      
      qVersion.on('close', (code) => {
        if (code === 0 && output.trim()) {
          // Extract version number from output (handle various formats)
          const versionMatch = output.match(/(\d+\.\d+\.\d+)/);
          resolve(versionMatch ? versionMatch[1] : null);
        } else {
          resolve(null);
        }
      });
      
      qVersion.on('error', () => {
        resolve(null);
      });
    });
  }

  /**
   * Check if version meets minimum requirements
   */
  private isVersionCompatible(currentVersion: string, minVersion: string): boolean {
    const current = this.parseVersion(currentVersion);
    const minimum = this.parseVersion(minVersion);
    
    if (current.major > minimum.major) return true;
    if (current.major < minimum.major) return false;
    
    if (current.minor > minimum.minor) return true;
    if (current.minor < minimum.minor) return false;
    
    return current.patch >= minimum.patch;
  }

  /**
   * Parse semantic version string
   */
  private parseVersion(version: string): { major: number; minor: number; patch: number } {
    const parts = version.split('.').map(Number);
    return {
      major: parts[0] || 0,
      minor: parts[1] || 0,
      patch: parts[2] || 0
    };
  }

  /**
   * Check for required Q CLI features
   */
  private async checkRequiredFeatures(): Promise<boolean> {
    return new Promise((resolve) => {
      // Check if Q CLI supports chat command (basic requirement)
      const qHelp = spawn(QCliDetector.Q_COMMAND, ['--help']);
      let output = '';
      
      qHelp.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      qHelp.on('close', (code) => {
        if (code === 0) {
          // Check for essential commands
          const hasChat = output.includes('chat') || output.includes('Chat');
          resolve(hasChat);
        } else {
          resolve(false);
        }
      });
      
      qHelp.on('error', () => {
        resolve(false);
      });
    });
  }

  /**
   * Generate installation guidance based on platform
   */
  getInstallationGuidance(): {
    platform: string;
    instructions: string[];
    links: string[];
  } {
    const platform = process.platform;
    
    switch (platform) {
      case 'darwin': // macOS
        return {
          platform: 'macOS',
          instructions: [
            'Install Amazon Q CLI using Homebrew:',
            '  brew install amazon-q',
            '',
            'Or download from AWS:',
            '  Visit the AWS Q CLI download page',
            '  Download the macOS installer',
            '  Follow the installation instructions'
          ],
          links: [
            'https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/cli-install.html'
          ]
        };
      
      case 'linux':
        return {
          platform: 'Linux',
          instructions: [
            'Install Amazon Q CLI:',
            '  # Download and install from AWS',
            '  curl -o q-cli.tar.gz <download-url>',
            '  tar -xzf q-cli.tar.gz',
            '  sudo ./install.sh',
            '',
            'Or use package manager if available:',
            '  # Check your distribution\'s package manager'
          ],
          links: [
            'https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/cli-install.html'
          ]
        };
      
      case 'win32': // Windows
        return {
          platform: 'Windows',
          instructions: [
            'Install Amazon Q CLI:',
            '  1. Download the Windows installer from AWS',
            '  2. Run the installer as Administrator',
            '  3. Follow the installation wizard',
            '  4. Restart your command prompt/PowerShell',
            '',
            'Or use package manager:',
            '  # If using Chocolatey or similar'
          ],
          links: [
            'https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/cli-install.html'
          ]
        };
      
      default:
        return {
          platform: 'Unknown',
          instructions: [
            'Install Amazon Q CLI:',
            '  Visit the AWS Q CLI documentation',
            '  Download the appropriate installer for your platform',
            '  Follow the installation instructions'
          ],
          links: [
            'https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/cli-install.html'
          ]
        };
    }
  }
}
