/**
 * Audit Command - Show Q service account activity log
 */

import chalk from 'chalk';
import { promises as fs } from 'fs';
import path from 'path';
import { ProjectDetector } from '../services/ProjectDetector.js';
import { ServiceAccountManager } from '../services/ServiceAccountManager.js';

interface AuditOptions {
  lines?: number;
  follow?: boolean;
  verbose?: boolean;
  sessionId?: string;
}

interface AuditLogEntry {
  timestamp: string;
  event: string;
  sessionId: string;
  user: string;
  project: string;
  workingDirectory?: string;
  gitIdentity?: {
    name: string;
    email: string;
  };
  awsProfile?: string;
  duration?: number;
  exitCode?: number;
}

export async function auditCommand(options: AuditOptions = {}) {
  console.log(chalk.cyan('🛫 no-wing - Q Service Account Audit Log'));
  console.log('');

  try {
    // Detect current project and generate Q config
    const detector = new ProjectDetector();
    const projectType = await detector.detect();
    const qConfig = await detector.generateQConfig();
    
    // Check if service account exists
    const manager = new ServiceAccountManager(qConfig);
    const status = await manager.getStatus();
    
    if (!status.exists) {
      console.log(chalk.yellow('⚠️  Q service account does not exist'));
      console.log(`  Expected username: ${qConfig.username}`);
      console.log('');
      console.log(chalk.cyan('🚀 To create Q service account:'));
      console.log('  no-wing setup    # Create Q service account');
      return;
    }

    // Show audit log header
    console.log(chalk.yellow('📋 Q Service Account Activity:'));
    console.log(`  Project: ${chalk.green(projectType.name)} (${projectType.type.toUpperCase()})`);
    console.log(`  Q User: ${chalk.green(qConfig.username)}`);
    console.log(`  Log Location: ${chalk.gray(path.join(qConfig.homeDirectory, '.no-wing', 'logs'))}`);
    console.log('');

    // Read audit log
    const logFile = path.join(qConfig.homeDirectory, '.no-wing', 'logs', 'q-sessions.log');
    
    try {
      await fs.access(logFile);
    } catch {
      console.log(chalk.gray('📝 No Q activity logged yet'));
      console.log('');
      console.log(chalk.cyan('💡 Q activity will appear here after:'));
      console.log('  no-wing launch    # Launch Q session');
      return;
    }

    // Read and parse log entries
    const logContent = await fs.readFile(logFile, 'utf8');
    const logLines = logContent.trim().split('\n').filter(line => line.trim());
    
    if (logLines.length === 0) {
      console.log(chalk.gray('📝 No Q activity logged yet'));
      return;
    }

    // Parse log entries
    const entries: AuditLogEntry[] = [];
    for (const line of logLines) {
      try {
        const entry = JSON.parse(line) as AuditLogEntry;
        entries.push(entry);
      } catch {
        // Skip malformed log lines
      }
    }

    // Filter by session ID if specified
    let filteredEntries = entries;
    if (options.sessionId) {
      filteredEntries = entries.filter(entry => entry.sessionId === options.sessionId);
      if (filteredEntries.length === 0) {
        console.log(chalk.yellow(`⚠️  No activity found for session: ${options.sessionId}`));
        return;
      }
    }

    // Sort by timestamp (newest first)
    filteredEntries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Limit number of entries if specified
    if (options.lines && options.lines > 0) {
      filteredEntries = filteredEntries.slice(0, options.lines);
    }

    // Display entries
    console.log(chalk.yellow(`📊 Recent Q Activity (${filteredEntries.length} entries):`));
    console.log('');

    for (const entry of filteredEntries) {
      const timestamp = new Date(entry.timestamp).toLocaleString();
      const eventIcon = getEventIcon(entry.event);
      const eventColor = getEventColor(entry.event);
      
      console.log(`${eventIcon} ${eventColor(entry.event.toUpperCase())} - ${chalk.gray(timestamp)}`);
      console.log(`  Session: ${chalk.cyan(entry.sessionId)}`);
      console.log(`  Project: ${chalk.green(entry.project)}`);
      
      if (options.verbose) {
        console.log(`  User: ${chalk.gray(entry.user)}`);
        if (entry.workingDirectory) {
          console.log(`  Directory: ${chalk.gray(entry.workingDirectory)}`);
        }
        if (entry.gitIdentity) {
          console.log(`  Git Identity: ${chalk.gray(entry.gitIdentity.name)} <${entry.gitIdentity.email}>`);
        }
        if (entry.awsProfile) {
          console.log(`  AWS Profile: ${chalk.gray(entry.awsProfile)}`);
        }
      }
      
      if (entry.event === 'session_end') {
        if (entry.duration) {
          const durationMinutes = Math.round(entry.duration / 1000 / 60);
          console.log(`  Duration: ${chalk.gray(durationMinutes)} minutes`);
        }
        if (entry.exitCode !== undefined) {
          const exitColor = entry.exitCode === 0 ? chalk.green : chalk.red;
          console.log(`  Exit Code: ${exitColor(entry.exitCode)}`);
        }
      }
      
      console.log('');
    }

    // Show summary statistics
    if (options.verbose) {
      console.log(chalk.yellow('📈 Session Statistics:'));
      
      const sessionStarts = entries.filter(e => e.event === 'session_start').length;
      const sessionEnds = entries.filter(e => e.event === 'session_end').length;
      const activeSessions = sessionStarts - sessionEnds;
      
      console.log(`  Total Sessions Started: ${chalk.green(sessionStarts)}`);
      console.log(`  Total Sessions Ended: ${chalk.green(sessionEnds)}`);
      console.log(`  Currently Active: ${activeSessions > 0 ? chalk.yellow(activeSessions) : chalk.gray('0')}`);
      
      // Calculate average session duration
      const endedSessions = entries.filter(e => e.event === 'session_end' && e.duration);
      if (endedSessions.length > 0) {
        const avgDuration = endedSessions.reduce((sum, e) => sum + (e.duration || 0), 0) / endedSessions.length;
        const avgMinutes = Math.round(avgDuration / 1000 / 60);
        console.log(`  Average Duration: ${chalk.gray(avgMinutes)} minutes`);
      }
      
      console.log('');
    }

    // Show unique sessions
    const uniqueSessions = [...new Set(entries.map(e => e.sessionId))];
    if (uniqueSessions.length > 1) {
      console.log(chalk.yellow(`🔍 Recent Sessions (${uniqueSessions.slice(0, 5).length} of ${uniqueSessions.length}):`));
      uniqueSessions.slice(0, 5).forEach(sessionId => {
        const sessionEntries = entries.filter(e => e.sessionId === sessionId);
        const startEntry = sessionEntries.find(e => e.event === 'session_start');
        const endEntry = sessionEntries.find(e => e.event === 'session_end');
        
        const status = endEntry ? chalk.gray('ended') : chalk.yellow('active');
        const startTime = startEntry ? new Date(startEntry.timestamp).toLocaleString() : 'unknown';
        
        console.log(`  ${chalk.cyan(sessionId)} - ${status} - ${chalk.gray(startTime)}`);
      });
      console.log('');
    }

    // Show helpful commands
    console.log(chalk.cyan('💡 Audit Commands:'));
    console.log('  no-wing audit --lines 10     # Show last 10 entries');
    console.log('  no-wing audit --verbose      # Show detailed information');
    console.log('  no-wing audit --session-id <id>  # Filter by session ID');
    
  } catch (error) {
    console.error(chalk.red('❌ Audit error:'), error instanceof Error ? error.message : 'Unknown error');
    
    if (error instanceof Error && error.message.includes('ENOENT')) {
      console.log('');
      console.log(chalk.yellow('💡 Log file not found:'));
      console.log('   • Q may not have been launched yet');
      console.log('   • Run "no-wing launch" to start Q and generate activity logs');
    }
    
    process.exit(1);
  }
}

/**
 * Get icon for event type
 */
function getEventIcon(event: string): string {
  switch (event) {
    case 'session_start':
      return '🚀';
    case 'session_end':
      return '🏁';
    default:
      return '📝';
  }
}

/**
 * Get color function for event type
 */
function getEventColor(event: string): (text: string) => string {
  switch (event) {
    case 'session_start':
      return chalk.green;
    case 'session_end':
      return chalk.blue;
    default:
      return chalk.gray;
  }
}
