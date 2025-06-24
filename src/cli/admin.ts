/**
 * Admin CLI commands for managing developer+Q pairs
 */

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { VendingService } from '../services/VendingService';
import { MonitoringService } from '../services/MonitoringService';
import { DeveloperQProvisionRequest } from '../types';

export function adminCommand(): void {
  const adminProgram = new Command();
  
  adminProgram
    .name('no-wing admin')
    .description('👨‍💼 Admin commands for managing developer+Q pairs');

  // Provision developer+Q pair
  adminProgram
    .command('provision-developer')
    .description('🏭 Provision a new developer+Q pair')
    .option('-e, --email <email>', 'Developer email address')
    .option('-r, --role <role>', 'Developer role (junior|senior|contractor|intern)')
    .option('-t, --team <team>', 'Team name')
    .option('-p, --projects <projects>', 'Comma-separated list of projects')
    .option('-b, --budget <budget>', 'Monthly budget limit in USD')
    .option('--duration <duration>', 'Duration for contractors/interns')
    .action(async (options) => {
      await provisionDeveloper(options);
    });

  // Dashboard
  adminProgram
    .command('dashboard')
    .description('📊 View monitoring dashboard')
    .action(async () => {
      await showDashboard();
    });

  // Monitor specific Q
  adminProgram
    .command('monitor')
    .description('🔍 Monitor specific Q agent')
    .argument('<qId>', 'Q agent ID to monitor')
    .option('--days <days>', 'Number of days to look back', '7')
    .action(async (qId, options) => {
      await monitorQ(qId, options);
    });

  // List all Q agents
  adminProgram
    .command('list')
    .description('📋 List all Q agents')
    .action(async () => {
      await listQAgents();
    });

  // Generate compliance report
  adminProgram
    .command('compliance-report')
    .description('📋 Generate compliance report')
    .option('--days <days>', 'Number of days to include', '30')
    .action(async (options) => {
      await generateComplianceReport(options);
    });

  adminProgram.parse();
}

export async function provisionDeveloper(options: any): Promise<void> {
  console.log(chalk.cyan('🏭 Developer+Q Provisioning'));
  console.log('============================');
  console.log('');

  let request: DeveloperQProvisionRequest;

  if (options.email && options.role && options.team) {
    // Use provided options
    request = {
      developerId: '', // Will be generated
      email: options.email,
      role: options.role,
      team: options.team,
      projects: options.projects ? options.projects.split(',') : [],
      budgetLimit: options.budget ? parseInt(options.budget) : undefined,
      duration: options.duration
    };
  } else {
    // Interactive prompts
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'email',
        message: 'Developer email address:',
        validate: (input) => input.includes('@') || 'Please enter a valid email'
      },
      {
        type: 'list',
        name: 'role',
        message: 'Developer role:',
        choices: ['junior', 'senior', 'contractor', 'intern']
      },
      {
        type: 'input',
        name: 'team',
        message: 'Team name:',
        validate: (input) => input.length > 0 || 'Team name is required'
      },
      {
        type: 'input',
        name: 'projects',
        message: 'Projects (comma-separated):',
        default: ''
      },
      {
        type: 'number',
        name: 'budgetLimit',
        message: 'Monthly budget limit (USD):',
        default: 1000
      }
    ]);

    request = {
      developerId: '', // Will be generated
      email: answers.email,
      role: answers.role,
      team: answers.team,
      projects: answers.projects ? answers.projects.split(',').map((p: string) => p.trim()) : [],
      budgetLimit: answers.budgetLimit
    };
  }

  const spinner = ora('Provisioning developer+Q pair...').start();

  try {
    const vendingService = new VendingService();
    const result = await vendingService.provisionDeveloperQ(request);

    if (result.success) {
      spinner.succeed('Developer+Q pair provisioned successfully!');
      console.log('');
      console.log(chalk.green('✅ Provisioning Complete'));
      console.log('========================');
      console.log(`Developer ID: ${chalk.cyan(result.developerId)}`);
      console.log(`Q Agent ID: ${chalk.cyan(result.qId)}`);
      console.log(`Human IAM Role: ${chalk.gray(result.humanIAMRole)}`);
      console.log(`Q IAM Role: ${chalk.gray(result.qIAMRole)}`);
      console.log('');
      console.log(chalk.yellow('📧 Send this onboarding token to the developer:'));
      console.log(chalk.cyan(result.onboardingToken));
      console.log('');
      console.log(chalk.gray('Setup Instructions:'));
      console.log(result.setupInstructions);
    } else {
      spinner.fail('Failed to provision developer+Q pair');
      console.error(chalk.red('❌ Error:'), result.error);
    }
  } catch (error) {
    spinner.fail('Provisioning failed');
    console.error(chalk.red('❌ Error:'), error);
  }
}

export async function showDashboard(): Promise<void> {
  console.log(chalk.cyan('📊 no-wing Admin Dashboard'));
  console.log('===========================');
  console.log('');

  const spinner = ora('Loading dashboard data...').start();

  try {
    const monitoringService = new MonitoringService();
    const dashboardData = await monitoringService.getDashboardData();

    spinner.succeed('Dashboard loaded');
    console.log('');

    // Overview stats
    console.log(chalk.yellow('📈 Overview'));
    console.log(`Total Q Agents: ${chalk.cyan(dashboardData.totalQAgents)}`);
    console.log(`Active Alerts: ${chalk.red(dashboardData.activeAlerts)}`);
    console.log(`Monthly Cost: ${chalk.green('$' + dashboardData.totalCostThisMonth.toFixed(2))}`);
    console.log('');

    // Top risk Q agents
    if (dashboardData.topRiskQAgents.length > 0) {
      console.log(chalk.yellow('⚠️  Top Risk Q Agents'));
      dashboardData.topRiskQAgents.forEach((q, index) => {
        const riskColor = q.riskScore > 70 ? chalk.red : q.riskScore > 40 ? chalk.yellow : chalk.green;
        console.log(`${index + 1}. ${chalk.cyan(q.qId)} - Risk: ${riskColor(q.riskScore)}`);
      });
      console.log('');
    }

    console.log(chalk.gray('💡 Use "no-wing admin monitor <qId>" to view detailed Q agent information'));
    console.log(chalk.gray('💡 Use "no-wing admin compliance-report" to generate compliance reports'));

  } catch (error) {
    spinner.fail('Failed to load dashboard');
    console.error(chalk.red('❌ Error:'), error);
  }
}

export async function monitorQ(qId: string, options: any): Promise<void> {
  console.log(chalk.cyan(`🔍 Monitoring Q Agent: ${qId}`));
  console.log('================================');
  console.log('');

  const spinner = ora('Loading Q agent data...').start();

  try {
    const monitoringService = new MonitoringService();
    const days = parseInt(options.days) || 7;
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const activities = await monitoringService.getQActivities(qId, {
      start: startDate,
      end: endDate
    });

    const alerts = await monitoringService.getQAlerts(qId);

    spinner.succeed(`Loaded ${activities.length} activities and ${alerts.length} alerts`);
    console.log('');

    // Activity summary
    console.log(chalk.yellow(`📊 Activity Summary (Last ${days} days)`));
    console.log(`Total Activities: ${chalk.cyan(activities.length)}`);
    
    const successfulActivities = activities.filter(a => a.success).length;
    const successRate = activities.length > 0 ? (successfulActivities / activities.length * 100).toFixed(1) : '0';
    console.log(`Success Rate: ${chalk.green(successRate + '%')}`);
    
    const totalCost = activities.reduce((sum, a) => sum + (a.cost || 0), 0);
    console.log(`Total Cost: ${chalk.green('$' + totalCost.toFixed(2))}`);
    console.log('');

    // Recent activities
    if (activities.length > 0) {
      console.log(chalk.yellow('🕒 Recent Activities'));
      activities.slice(-5).forEach(activity => {
        const statusIcon = activity.success ? '✅' : '❌';
        const riskColor = activity.riskLevel === 'high' ? chalk.red : 
                         activity.riskLevel === 'medium' ? chalk.yellow : chalk.green;
        console.log(`${statusIcon} ${activity.action} - ${riskColor(activity.riskLevel)} risk - ${activity.timestamp.toLocaleString()}`);
      });
      console.log('');
    }

    // Active alerts
    const activeAlerts = alerts.filter(a => !a.resolved);
    if (activeAlerts.length > 0) {
      console.log(chalk.yellow('🚨 Active Alerts'));
      activeAlerts.forEach(alert => {
        const severityColor = alert.severity === 'critical' ? chalk.red :
                             alert.severity === 'high' ? chalk.red :
                             alert.severity === 'medium' ? chalk.yellow : chalk.green;
        console.log(`${severityColor(alert.severity.toUpperCase())}: ${alert.message}`);
      });
      console.log('');
    }

  } catch (error) {
    spinner.fail('Failed to load Q agent data');
    console.error(chalk.red('❌ Error:'), error);
  }
}

async function listQAgents(): Promise<void> {
  console.log(chalk.cyan('📋 All Q Agents'));
  console.log('================');
  console.log('');

  // In real implementation, this would query the database
  console.log(chalk.gray('No Q agents found. Use "no-wing admin provision-developer" to create some.'));
}

async function generateComplianceReport(options: any): Promise<void> {
  console.log(chalk.cyan('📋 Generating Compliance Report'));
  console.log('================================');
  console.log('');

  const spinner = ora('Generating report...').start();

  try {
    const monitoringService = new MonitoringService();
    const days = parseInt(options.days) || 30;
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const report = await monitoringService.generateComplianceReport({
      start: startDate,
      end: endDate
    });

    spinner.succeed('Compliance report generated');
    console.log('');

    console.log(chalk.yellow(`📊 Compliance Report (${days} days)`));
    console.log(`Period: ${startDate.toDateString()} - ${endDate.toDateString()}`);
    console.log(`Total Q Agents: ${chalk.cyan(report.totalQAgents)}`);
    console.log(`Total Activities: ${chalk.cyan(report.totalActivities)}`);
    console.log(`Risk Events: ${chalk.red(report.riskEvents.length)}`);
    console.log(`Escalation Requests: ${chalk.yellow(report.escalationRequests.length)}`);
    console.log('');

    // Cost breakdown
    if (Object.keys(report.costByQ).length > 0) {
      console.log(chalk.yellow('💰 Cost by Q Agent'));
      Object.entries(report.costByQ).forEach(([qId, cost]) => {
        console.log(`${qId}: ${chalk.green('$' + cost.toFixed(2))}`);
      });
      console.log('');
    }

    console.log(chalk.gray('💡 Full report data available via API for integration with compliance tools'));

  } catch (error) {
    spinner.fail('Failed to generate compliance report');
    console.error(chalk.red('❌ Error:'), error);
  }
}
