/**
 * Monitoring Service for tracking Q agent activities and compliance
 */

import { 
  QActivity, 
  MonitoringAlert, 
  ComplianceReport, 
  EscalationRequest,
  QCapabilityLevel 
} from '../types';

export class MonitoringService {
  private activities: Map<string, QActivity[]> = new Map();
  private alerts: MonitoringAlert[] = [];

  /**
   * Set up monitoring for a new Q agent
   */
  async setupQMonitoring(qId: string, developerId: string): Promise<void> {
    console.log(`📊 Setting up monitoring for Q agent: ${qId}`);
    
    // Initialize activity tracking
    this.activities.set(qId, []);
    
    // Set up CloudWatch alarms (in real implementation)
    await this.createCloudWatchAlarms(qId);
    
    // Set up cost monitoring
    await this.setupCostMonitoring(qId);
    
    console.log(`✅ Monitoring configured for ${qId}`);
  }

  /**
   * Log Q agent activity
   */
  async logActivity(activity: QActivity): Promise<void> {
    console.log(`📝 Logging activity for Q ${activity.qId}: ${activity.action}`);
    
    // Store activity
    const qActivities = this.activities.get(activity.qId) || [];
    qActivities.push(activity);
    this.activities.set(activity.qId, qActivities);
    
    // Check for anomalies
    await this.checkForAnomalies(activity);
    
    // Update risk score
    await this.updateRiskScore(activity.qId);
    
    // Check cost thresholds
    await this.checkCostThresholds(activity);
  }

  /**
   * Get activities for a Q agent
   */
  async getQActivities(
    qId: string, 
    timeRange?: { start: Date; end: Date }
  ): Promise<QActivity[]> {
    const activities = this.activities.get(qId) || [];
    
    if (!timeRange) {
      return activities;
    }
    
    return activities.filter(activity => 
      activity.timestamp >= timeRange.start && 
      activity.timestamp <= timeRange.end
    );
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(
    timeRange: { start: Date; end: Date }
  ): Promise<ComplianceReport> {
    console.log(`📋 Generating compliance report for ${timeRange.start} to ${timeRange.end}`);
    
    const allActivities: QActivity[] = [];
    const costByQ: Record<string, number> = {};
    
    // Aggregate activities from all Q agents
    for (const [qId, activities] of this.activities.entries()) {
      const filteredActivities = activities.filter(activity =>
        activity.timestamp >= timeRange.start && 
        activity.timestamp <= timeRange.end
      );
      
      allActivities.push(...filteredActivities);
      
      // Calculate cost per Q
      costByQ[qId] = filteredActivities.reduce(
        (total, activity) => total + (activity.cost || 0), 
        0
      );
    }
    
    // Get alerts in time range
    const riskEvents = this.alerts.filter(alert =>
      alert.timestamp >= timeRange.start && 
      alert.timestamp <= timeRange.end
    );
    
    // Get escalation requests (in real implementation, from database)
    const escalationRequests = await this.getEscalationRequests(timeRange);
    
    return {
      period: timeRange,
      totalQAgents: this.activities.size,
      totalActivities: allActivities.length,
      costByQ,
      riskEvents,
      escalationRequests
    };
  }

  /**
   * Check for anomalous behavior
   */
  private async checkForAnomalies(activity: QActivity): Promise<void> {
    const qActivities = this.activities.get(activity.qId) || [];
    
    // Check for unusual cost spikes
    if (activity.cost && activity.cost > 100) {
      await this.createAlert({
        qId: activity.qId,
        type: 'cost',
        severity: 'high',
        message: `High cost activity: $${activity.cost} for ${activity.action}`,
        timestamp: new Date(),
        resolved: false
      });
    }
    
    // Check for rapid successive actions
    const recentActivities = qActivities.filter(a => 
      Date.now() - a.timestamp.getTime() < 60000 // Last minute
    );
    
    if (recentActivities.length > 10) {
      await this.createAlert({
        qId: activity.qId,
        type: 'anomaly',
        severity: 'medium',
        message: `Rapid activity detected: ${recentActivities.length} actions in 1 minute`,
        timestamp: new Date(),
        resolved: false
      });
    }
    
    // Check for high-risk actions
    if (activity.riskLevel === 'high') {
      await this.createAlert({
        qId: activity.qId,
        type: 'security',
        severity: 'high',
        message: `High-risk action performed: ${activity.action}`,
        timestamp: new Date(),
        resolved: false
      });
    }
  }

  /**
   * Update risk score for Q agent
   */
  private async updateRiskScore(qId: string): Promise<void> {
    const activities = this.activities.get(qId) || [];
    
    // Calculate risk score based on recent activities
    const recentActivities = activities.filter(a => 
      Date.now() - a.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000 // Last 7 days
    );
    
    let riskScore = 0;
    
    for (const activity of recentActivities) {
      switch (activity.riskLevel) {
        case 'low':
          riskScore += 1;
          break;
        case 'medium':
          riskScore += 3;
          break;
        case 'high':
          riskScore += 10;
          break;
      }
      
      // Penalty for failed activities
      if (!activity.success) {
        riskScore += 5;
      }
    }
    
    // Normalize risk score (0-100)
    const normalizedRiskScore = Math.min(100, riskScore);
    
    // In real implementation, update Q identity in database
    console.log(`📊 Updated risk score for ${qId}: ${normalizedRiskScore}`);
  }

  /**
   * Check cost thresholds
   */
  private async checkCostThresholds(activity: QActivity): Promise<void> {
    if (!activity.cost) return;
    
    const qActivities = this.activities.get(activity.qId) || [];
    
    // Calculate monthly cost
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    
    const monthlyCost = qActivities
      .filter(a => a.timestamp >= monthStart)
      .reduce((total, a) => total + (a.cost || 0), 0);
    
    // Alert thresholds (in real implementation, these would be configurable)
    const warningThreshold = 100; // $100
    const criticalThreshold = 500; // $500
    
    if (monthlyCost > criticalThreshold) {
      await this.createAlert({
        qId: activity.qId,
        type: 'cost',
        severity: 'critical',
        message: `Monthly cost exceeded critical threshold: $${monthlyCost}`,
        timestamp: new Date(),
        resolved: false
      });
    } else if (monthlyCost > warningThreshold) {
      await this.createAlert({
        qId: activity.qId,
        type: 'cost',
        severity: 'medium',
        message: `Monthly cost exceeded warning threshold: $${monthlyCost}`,
        timestamp: new Date(),
        resolved: false
      });
    }
  }

  /**
   * Create monitoring alert
   */
  private async createAlert(alertData: Omit<MonitoringAlert, 'id'>): Promise<void> {
    const alert: MonitoringAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      ...alertData
    };
    
    this.alerts.push(alert);
    
    console.log(`🚨 Alert created: ${alert.type} - ${alert.message}`);
    
    // In real implementation, send notifications (email, Slack, etc.)
    await this.sendAlertNotification(alert);
  }

  /**
   * Set up CloudWatch alarms for Q agent
   */
  private async createCloudWatchAlarms(qId: string): Promise<void> {
    // In real implementation, create CloudWatch alarms for:
    // - Lambda invocation errors
    // - High cost metrics
    // - Unusual activity patterns
    console.log(`⏰ CloudWatch alarms configured for ${qId}`);
  }

  /**
   * Set up cost monitoring for Q agent
   */
  private async setupCostMonitoring(qId: string): Promise<void> {
    // In real implementation, set up AWS Cost Explorer alerts
    console.log(`💰 Cost monitoring configured for ${qId}`);
  }

  /**
   * Send alert notification
   */
  private async sendAlertNotification(alert: MonitoringAlert): Promise<void> {
    // In real implementation, send to Slack, email, PagerDuty, etc.
    console.log(`📧 Alert notification sent for ${alert.id}`);
  }

  /**
   * Get escalation requests in time range
   */
  private async getEscalationRequests(
    timeRange: { start: Date; end: Date }
  ): Promise<EscalationRequest[]> {
    // In real implementation, query database
    return [];
  }

  /**
   * Get all alerts for a Q agent
   */
  async getQAlerts(qId: string): Promise<MonitoringAlert[]> {
    return this.alerts.filter(alert => alert.qId === qId);
  }

  /**
   * Get dashboard data for admin interface
   */
  async getDashboardData(): Promise<{
    totalQAgents: number;
    activeAlerts: number;
    totalCostThisMonth: number;
    topRiskQAgents: Array<{ qId: string; riskScore: number }>;
  }> {
    const totalQAgents = this.activities.size;
    const activeAlerts = this.alerts.filter(a => !a.resolved).length;
    
    // Calculate total cost this month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    
    let totalCostThisMonth = 0;
    for (const activities of this.activities.values()) {
      totalCostThisMonth += activities
        .filter(a => a.timestamp >= monthStart)
        .reduce((sum, a) => sum + (a.cost || 0), 0);
    }
    
    // Get top risk Q agents (placeholder)
    const topRiskQAgents = Array.from(this.activities.keys())
      .map(qId => ({ qId, riskScore: Math.floor(Math.random() * 100) }))
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 5);
    
    return {
      totalQAgents,
      activeAlerts,
      totalCostThisMonth,
      topRiskQAgents
    };
  }
}
