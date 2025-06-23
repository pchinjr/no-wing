import chalk from 'chalk';
import inquirer from 'inquirer';
import { QVerificationSystem } from '../q/verification';
import { QWorkflowManager } from '../q/workflow';

interface VerifyOptions {
  all?: boolean;
  commit?: string;
  request?: string;
}

export async function verifyCommand(options: VerifyOptions, commits?: string[]): Promise<void> {
  console.log(chalk.blue.bold('🔍 Q Verification System'));
  console.log(chalk.gray('Human-in-the-loop verification for Q operations\n'));

  const verification = new QVerificationSystem();
  
  if (options.request) {
    // Verify a specific permission request
    await verifyPermissionRequest(verification, options.request);
  } else if (options.commit || commits?.length) {
    // Verify commits
    await verifyCommits(options.commit ? [options.commit] : commits || []);
  } else if (options.all) {
    // Show all pending items
    await showAllPending(verification);
  } else {
    // Interactive verification menu
    await interactiveVerification(verification);
  }
}

async function verifyPermissionRequest(verification: QVerificationSystem, requestId: string): Promise<void> {
  console.log(chalk.yellow(`🤖 Reviewing Q's permission request: ${requestId}\n`));

  const { approved } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'approved',
      message: 'Do you approve this request?',
      default: false
    }
  ]);

  const { approver } = await inquirer.prompt([
    {
      type: 'input',
      name: 'approver',
      message: 'Your name (for audit trail):',
      validate: (input: string) => input.length > 0 || 'Name is required for audit'
    }
  ]);

  const success = verification.approveRequest(requestId, approved, approver);
  
  if (success) {
    if (approved) {
      console.log(chalk.green(`✅ Request ${requestId} approved by ${approver}`));
      console.log(chalk.gray('Q can now proceed with the operation'));
    } else {
      console.log(chalk.red(`❌ Request ${requestId} denied by ${approver}`));
      console.log(chalk.gray('Q will not perform this operation'));
    }
  }
}

async function verifyCommits(commitHashes: string[]): Promise<void> {
  console.log(chalk.yellow('🤖 Reviewing Q\'s commits...\n'));

  // Load workflow manager (would need config from .no-wing/metadata.json)
  const config = {
    developer: 'Developer', // Would load from config
    repo: 'repo',
    branchPrefix: 'q-feature',
    commitMessagePrefix: 'q',
    requiresPR: true,
    autoMerge: false,
    maxCommitsPerBranch: 10
  };

  const workflow = new QWorkflowManager(config);

  // Show each commit for review
  for (const hash of commitHashes) {
    console.log(chalk.cyan(`\n📝 Reviewing commit ${hash.substring(0, 8)}:`));
    workflow.showCommitDiff(hash);

    const { approved } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'approved',
        message: `Approve commit ${hash.substring(0, 8)}?`,
        default: true
      }
    ]);

    if (!approved) {
      console.log(chalk.red(`❌ Commit ${hash.substring(0, 8)} not approved`));
      return;
    }
  }

  const { approver } = await inquirer.prompt([
    {
      type: 'input',
      name: 'approver',
      message: 'Your name (for audit trail):',
      validate: (input: string) => input.length > 0 || 'Name is required for audit'
    }
  ]);

  workflow.verifyCommits(commitHashes, approver);
  console.log(chalk.green(`\n✅ All ${commitHashes.length} commits verified by ${approver}`));
}

async function showAllPending(verification: QVerificationSystem): Promise<void> {
  console.log(chalk.blue('📋 All Pending Q Verifications\n'));

  // Show pending permission requests
  verification.displayPendingRequests();

  // Show pending commits
  const config = {
    developer: 'Developer',
    repo: 'repo', 
    branchPrefix: 'q-feature',
    commitMessagePrefix: 'q',
    requiresPR: true,
    autoMerge: false,
    maxCommitsPerBranch: 10
  };

  const workflow = new QWorkflowManager(config);
  workflow.displayUnverifiedCommits();

  // Show Q's current metrics
  const metrics = verification.getSuccessMetrics();
  console.log('\n📊 Q Performance Metrics:');
  console.log(`   Total Operations: ${metrics.totalOperations}`);
  console.log(`   Success Rate: ${metrics.successRate.toFixed(1)}%`);
  console.log(`   Error Rate: ${metrics.errorRate.toFixed(1)}%`);
  console.log(`   Security Violations: ${metrics.securityViolations}`);
  
  if (metrics.averageDuration > 0) {
    console.log(`   Average Duration: ${metrics.averageDuration.toFixed(1)}s`);
  }
}

async function interactiveVerification(verification: QVerificationSystem): Promise<void> {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to verify?',
      choices: [
        { name: '🔐 Review Q\'s permission requests', value: 'permissions' },
        { name: '📝 Review Q\'s commits', value: 'commits' },
        { name: '📊 View Q\'s performance metrics', value: 'metrics' },
        { name: '📋 Show all pending items', value: 'all' },
        { name: '❌ Exit', value: 'exit' }
      ]
    }
  ]);

  switch (action) {
    case 'permissions':
      verification.displayPendingRequests();
      break;
    case 'commits':
      const workflow = new QWorkflowManager({
        developer: 'Developer',
        repo: 'repo',
        branchPrefix: 'q-feature', 
        commitMessagePrefix: 'q',
        requiresPR: true,
        autoMerge: false,
        maxCommitsPerBranch: 10
      });
      workflow.displayUnverifiedCommits();
      break;
    case 'metrics':
      const metrics = verification.getSuccessMetrics();
      console.log('\n📊 Q Performance Metrics:');
      console.log(`   Total Operations: ${metrics.totalOperations}`);
      console.log(`   Success Rate: ${metrics.successRate.toFixed(1)}%`);
      console.log(`   Error Rate: ${metrics.errorRate.toFixed(1)}%`);
      console.log(`   Security Violations: ${metrics.securityViolations}`);
      break;
    case 'all':
      await showAllPending(verification);
      break;
    case 'exit':
      console.log(chalk.gray('👋 Goodbye!'));
      break;
  }
}

export async function approveCommand(requestId: string): Promise<void> {
  const verification = new QVerificationSystem();
  
  const { approver } = await inquirer.prompt([
    {
      type: 'input',
      name: 'approver',
      message: 'Your name (for audit trail):',
      validate: (input: string) => input.length > 0 || 'Name is required for audit'
    }
  ]);

  const success = verification.approveRequest(requestId, true, approver);
  
  if (success) {
    console.log(chalk.green(`✅ Request ${requestId} approved by ${approver}`));
  } else {
    console.log(chalk.red(`❌ Request ${requestId} not found`));
  }
}

export async function denyCommand(requestId: string): Promise<void> {
  const verification = new QVerificationSystem();
  
  const { approver } = await inquirer.prompt([
    {
      type: 'input',
      name: 'approver',
      message: 'Your name (for audit trail):',
      validate: (input: string) => input.length > 0 || 'Name is required for audit'
    }
  ]);

  const success = verification.approveRequest(requestId, false, approver);
  
  if (success) {
    console.log(chalk.red(`❌ Request ${requestId} denied by ${approver}`));
  } else {
    console.log(chalk.red(`❌ Request ${requestId} not found`));
  }
}
