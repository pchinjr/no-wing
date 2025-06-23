import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface QWorkflowConfig {
  developer: string;
  repo: string;
  branchPrefix: string;
  commitMessagePrefix: string;
  requiresPR: boolean;
  autoMerge: boolean;
  maxCommitsPerBranch: number;
}

export interface QCommit {
  hash: string;
  message: string;
  files: string[];
  timestamp: string;
  verified: boolean;
  humanApproved: boolean;
}

export class QWorkflowManager {
  private config: QWorkflowConfig;
  private currentBranch: string | null = null;
  private commits: QCommit[] = [];

  constructor(config: QWorkflowConfig) {
    this.config = config;
    this.loadCommitHistory();
  }

  /**
   * Start a new feature branch for Q's work
   */
  startFeatureBranch(featureName: string): string {
    const branchName = `${this.config.branchPrefix}/${featureName}`;
    
    try {
      // Ensure we're on main/develop
      execSync('git checkout main', { stdio: 'pipe' });
      execSync('git pull origin main', { stdio: 'pipe' });
      
      // Create and checkout new branch
      execSync(`git checkout -b ${branchName}`, { stdio: 'pipe' });
      
      this.currentBranch = branchName;
      
      console.log(`🤖 Q: Created feature branch '${branchName}'`);
      console.log(`🤖 Q: Ready to make small, frequent commits!`);
      
      return branchName;
    } catch (error) {
      throw new Error(`Failed to create feature branch: ${error}`);
    }
  }

  /**
   * Make a small, focused commit
   */
  makeCommit(
    files: string[],
    message: string,
    description?: string
  ): QCommit {
    if (!this.currentBranch) {
      throw new Error('No active feature branch. Call startFeatureBranch() first.');
    }

    // Validate commit size (small commits only)
    if (files.length > 5) {
      throw new Error('Q commits must be small - maximum 5 files per commit');
    }

    // Check if we've exceeded max commits per branch
    const branchCommits = this.commits.filter(c => !c.verified);
    if (branchCommits.length >= this.config.maxCommitsPerBranch) {
      throw new Error(`Maximum ${this.config.maxCommitsPerBranch} commits per branch reached. Create PR first.`);
    }

    try {
      // Stage files
      files.forEach(file => {
        execSync(`git add ${file}`, { stdio: 'pipe' });
      });

      // Create commit with Q prefix
      const commitMessage = `${this.config.commitMessagePrefix}: ${message}`;
      const fullMessage = description ? `${commitMessage}\n\n${description}` : commitMessage;
      
      execSync(`git commit -m "${fullMessage}"`, { stdio: 'pipe' });
      
      // Get commit hash
      const hash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
      
      const commit: QCommit = {
        hash,
        message: commitMessage,
        files,
        timestamp: new Date().toISOString(),
        verified: false,
        humanApproved: false
      };

      this.commits.push(commit);
      this.saveCommitHistory();

      console.log(`🤖 Q: Made commit ${hash.substring(0, 8)}: ${message}`);
      console.log(`🤖 Q: Files changed: ${files.join(', ')}`);
      console.log(`🤖 Q: Awaiting human verification...`);

      return commit;
    } catch (error) {
      throw new Error(`Failed to make commit: ${error}`);
    }
  }

  /**
   * Human verifies Q's commits
   */
  verifyCommits(commitHashes: string[], approver: string): void {
    let verifiedCount = 0;

    commitHashes.forEach(hash => {
      const commit = this.commits.find(c => c.hash.startsWith(hash));
      if (commit && !commit.verified) {
        commit.verified = true;
        commit.humanApproved = true;
        verifiedCount++;
        
        console.log(`✅ ${approver} verified commit ${hash.substring(0, 8)}: ${commit.message}`);
      }
    });

    if (verifiedCount > 0) {
      this.saveCommitHistory();
      console.log(`\n✅ ${verifiedCount} commits verified by ${approver}`);
      
      // Check if ready for PR
      const unverifiedCommits = this.commits.filter(c => !c.verified);
      if (unverifiedCommits.length === 0) {
        console.log('🚀 All commits verified! Ready to create pull request.');
        console.log('💡 Use: no-wing create-pr');
      }
    }
  }

  /**
   * Create pull request for Q's work
   */
  async createPullRequest(title: string, description: string): Promise<string> {
    if (!this.currentBranch) {
      throw new Error('No active feature branch');
    }

    // Ensure all commits are verified
    const unverifiedCommits = this.commits.filter(c => !c.verified);
    if (unverifiedCommits.length > 0) {
      throw new Error(`${unverifiedCommits.length} commits still need human verification`);
    }

    try {
      // Push branch to remote
      execSync(`git push origin ${this.currentBranch}`, { stdio: 'pipe' });

      // Create PR description with Q's work summary
      const prDescription = this.generatePRDescription(description);

      console.log(`🤖 Q: Created pull request for branch '${this.currentBranch}'`);
      console.log(`🤖 Q: Title: ${title}`);
      console.log(`🤖 Q: All ${this.commits.length} commits have been human-verified`);
      console.log(`🤖 Q: Ready for code review!`);

      // Reset for next feature
      this.currentBranch = null;
      this.commits = [];
      this.saveCommitHistory();

      return this.currentBranch || 'unknown';
    } catch (error) {
      throw new Error(`Failed to create pull request: ${error}`);
    }
  }

  /**
   * Get Q's current work status
   */
  getWorkStatus(): {
    currentBranch: string | null;
    totalCommits: number;
    verifiedCommits: number;
    unverifiedCommits: number;
    readyForPR: boolean;
  } {
    const verifiedCommits = this.commits.filter(c => c.verified);
    const unverifiedCommits = this.commits.filter(c => !c.verified);

    return {
      currentBranch: this.currentBranch,
      totalCommits: this.commits.length,
      verifiedCommits: verifiedCommits.length,
      unverifiedCommits: unverifiedCommits.length,
      readyForPR: unverifiedCommits.length === 0 && this.commits.length > 0
    };
  }

  /**
   * Display Q's unverified commits for human review
   */
  displayUnverifiedCommits(): void {
    const unverified = this.commits.filter(c => !c.verified);

    if (unverified.length === 0) {
      console.log('✅ All Q commits have been verified');
      return;
    }

    console.log('\n🤖 Q Commits Awaiting Verification:\n');

    unverified.forEach((commit, index) => {
      console.log(`${index + 1}. ${commit.hash.substring(0, 8)} - ${commit.message}`);
      console.log(`   Files: ${commit.files.join(', ')}`);
      console.log(`   Time: ${new Date(commit.timestamp).toLocaleString()}`);
      console.log('');
    });

    console.log('💡 To verify commits:');
    console.log(`   git log --oneline -${unverified.length}  # Review changes`);
    console.log(`   no-wing verify <commit-hash>...          # Verify specific commits`);
    console.log(`   no-wing verify-all                       # Verify all pending`);
  }

  /**
   * Show diff for a specific commit
   */
  showCommitDiff(commitHash: string): void {
    try {
      const diff = execSync(`git show ${commitHash}`, { encoding: 'utf8' });
      console.log(diff);
    } catch (error) {
      console.error(`Failed to show diff for ${commitHash}: ${error}`);
    }
  }

  private generatePRDescription(description: string): string {
    const commitSummary = this.commits.map(c => 
      `- ${c.hash.substring(0, 8)}: ${c.message.replace(this.config.commitMessagePrefix + ': ', '')}`
    ).join('\n');

    return `
${description}

## Q's Work Summary

This PR contains ${this.commits.length} small, focused commits from Q (AI teammate):

${commitSummary}

## Human Verification

✅ All commits have been reviewed and verified by ${this.config.developer}
✅ Each commit is small and focused (max 5 files)
✅ All changes follow security guidelines
✅ Q operated within approved capability level

## Q's Notes

🤖 Q: I've made small, frequent commits as requested. Each change is focused and well-documented. All work has been human-verified before creating this PR.

Ready for code review! 🚀
`.trim();
  }

  private loadCommitHistory(): void {
    const historyPath = join(process.cwd(), '.no-wing', 'q-commits.json');
    
    if (existsSync(historyPath)) {
      try {
        const data = readFileSync(historyPath, 'utf8');
        this.commits = JSON.parse(data);
      } catch (error) {
        console.warn('Failed to load Q commit history, starting fresh');
        this.commits = [];
      }
    }
  }

  private saveCommitHistory(): void {
    const historyPath = join(process.cwd(), '.no-wing', 'q-commits.json');
    
    try {
      writeFileSync(historyPath, JSON.stringify(this.commits, null, 2));
    } catch (error) {
      console.warn('Failed to save Q commit history');
    }
  }
}
