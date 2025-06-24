/**
 * Core types for no-wing Developer+Q Vending System
 */

export interface DeveloperQProvisionRequest {
  developerId: string;
  email: string;
  role: 'junior' | 'senior' | 'contractor' | 'intern';
  team: string;
  projects: string[];
  duration?: string; // for contractors/interns
  budgetLimit?: number; // monthly AWS spend limit
  region?: string;
}

export interface ProvisionResult {
  success: boolean;
  developerId: string;
  qId: string;
  humanIAMRole: string;
  qIAMRole: string;
  onboardingToken: string;
  setupInstructions: string;
  error?: string;
}

export interface QIdentity {
  id: string;
  developerId: string;
  level: QCapabilityLevel;
  createdAt: Date;
  lastActive: Date;
  successfulTasks: number;
  failedTasks: number;
  totalCost: number;
  riskScore: number;
}

export enum QCapabilityLevel {
  OBSERVER = 'observer',     // Read-only access
  ASSISTANT = 'assistant',   // Limited modifications
  PARTNER = 'partner'        // Full development capabilities
}

export interface QActivity {
  id: string;
  qId: string;
  developerId: string;
  timestamp: Date;
  action: string;
  service: string;
  resources: string[];
  success: boolean;
  cost?: number;
  riskLevel: 'low' | 'medium' | 'high';
  details: any;
}

export interface IAMPolicyTemplate {
  name: string;
  version: string;
  statement: IAMStatement[];
}

export interface IAMStatement {
  effect: 'Allow' | 'Deny';
  action: string[];
  resource: string[];
  condition?: any;
}

export interface PermissionBoundary {
  policyArn: string;
  maxBudget: number;
  allowedServices: string[];
  deniedActions: string[];
  resourceConstraints: ResourceConstraint[];
}

export interface ResourceConstraint {
  service: string;
  resourceType: string;
  maxCount?: number;
  maxSize?: string;
  allowedRegions?: string[];
}

export interface MonitoringAlert {
  id: string;
  qId: string;
  type: 'cost' | 'security' | 'anomaly' | 'escalation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
}

export interface ComplianceReport {
  period: {
    start: Date;
    end: Date;
  };
  totalQAgents: number;
  totalActivities: number;
  costByQ: Record<string, number>;
  riskEvents: MonitoringAlert[];
  escalationRequests: EscalationRequest[];
}

export interface EscalationRequest {
  id: string;
  qId: string;
  developerId: string;
  currentLevel: QCapabilityLevel;
  requestedLevel: QCapabilityLevel;
  justification: string;
  timestamp: Date;
  status: 'pending' | 'approved' | 'denied';
  approvedBy?: string;
  approvedAt?: Date;
}

export interface OnboardingToken {
  token: string;
  developerId: string;
  qId: string;
  expiresAt: Date;
  used: boolean;
}

export interface DeveloperProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  team: string;
  projects: string[];
  qId: string;
  onboardedAt: Date;
  lastActive: Date;
  status: 'active' | 'inactive' | 'suspended';
}
