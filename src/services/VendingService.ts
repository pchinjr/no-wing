/**
 * Developer+Q Vending Service
 * Core service for provisioning new developer+Q pairs with proper IAM
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  DeveloperQProvisionRequest, 
  ProvisionResult, 
  QIdentity, 
  QCapabilityLevel,
  OnboardingToken,
  DeveloperProfile
} from '../types';
import { IAMService } from './IAMService';
import { MonitoringService } from './MonitoringService';

export class VendingService {
  private iamService: IAMService;
  private monitoringService: MonitoringService;

  constructor() {
    this.iamService = new IAMService();
    this.monitoringService = new MonitoringService();
  }

  /**
   * Provision a new developer+Q pair with appropriate IAM roles and monitoring
   */
  async provisionDeveloperQ(request: DeveloperQProvisionRequest): Promise<ProvisionResult> {
    try {
      console.log(`🏭 Provisioning developer+Q pair for ${request.email}`);

      // Generate unique IDs
      const developerId = this.generateDeveloperId(request.email);
      const qId = this.generateQId(developerId);

      // Create Q identity
      const qIdentity = await this.createQIdentity(qId, developerId, request);

      // Create IAM roles for both human and Q
      const humanRole = await this.iamService.createDeveloperRole(developerId, request);
      const qRole = await this.iamService.createQRole(qId, qIdentity.level, request);

      // Set up monitoring for the Q agent
      await this.monitoringService.setupQMonitoring(qId, developerId);

      // Create onboarding token
      const onboardingToken = await this.createOnboardingToken(developerId, qId);

      // Create developer profile
      await this.createDeveloperProfile(developerId, request, qId);

      // Generate setup instructions
      const setupInstructions = this.generateSetupInstructions(
        developerId, 
        qId, 
        onboardingToken.token
      );

      console.log(`✅ Successfully provisioned ${developerId} + ${qId}`);

      return {
        success: true,
        developerId,
        qId,
        humanIAMRole: humanRole.roleName,
        qIAMRole: qRole.roleName,
        onboardingToken: onboardingToken.token,
        setupInstructions
      };

    } catch (error) {
      console.error('❌ Failed to provision developer+Q pair:', error);
      return {
        success: false,
        developerId: '',
        qId: '',
        humanIAMRole: '',
        qIAMRole: '',
        onboardingToken: '',
        setupInstructions: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create Q identity with initial capability level
   */
  private async createQIdentity(
    qId: string, 
    developerId: string, 
    request: DeveloperQProvisionRequest
  ): Promise<QIdentity> {
    // Determine initial Q capability level based on developer role
    let initialLevel: QCapabilityLevel;
    switch (request.role) {
      case 'senior':
        initialLevel = QCapabilityLevel.ASSISTANT;
        break;
      case 'junior':
      case 'intern':
        initialLevel = QCapabilityLevel.OBSERVER;
        break;
      case 'contractor':
        initialLevel = QCapabilityLevel.OBSERVER; // Start conservative for contractors
        break;
      default:
        initialLevel = QCapabilityLevel.OBSERVER;
    }

    const qIdentity: QIdentity = {
      id: qId,
      developerId,
      level: initialLevel,
      createdAt: new Date(),
      lastActive: new Date(),
      successfulTasks: 0,
      failedTasks: 0,
      totalCost: 0,
      riskScore: 0
    };

    // Store Q identity (in real implementation, this would be in a database)
    await this.storeQIdentity(qIdentity);

    return qIdentity;
  }

  /**
   * Create onboarding token for developer setup
   */
  private async createOnboardingToken(developerId: string, qId: string): Promise<OnboardingToken> {
    const token: OnboardingToken = {
      token: uuidv4(),
      developerId,
      qId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      used: false
    };

    // Store token (in real implementation, this would be in a database)
    await this.storeOnboardingToken(token);

    return token;
  }

  /**
   * Create developer profile
   */
  private async createDeveloperProfile(
    developerId: string, 
    request: DeveloperQProvisionRequest, 
    qId: string
  ): Promise<DeveloperProfile> {
    const profile: DeveloperProfile = {
      id: developerId,
      email: request.email,
      name: this.extractNameFromEmail(request.email),
      role: request.role,
      team: request.team,
      projects: request.projects,
      qId,
      onboardedAt: new Date(),
      lastActive: new Date(),
      status: 'active'
    };

    // Store profile (in real implementation, this would be in a database)
    await this.storeDeveloperProfile(profile);

    return profile;
  }

  /**
   * Generate setup instructions for the developer
   */
  private generateSetupInstructions(
    developerId: string, 
    qId: string, 
    token: string
  ): string {
    return `
🛫 Welcome to no-wing! Your Developer+Q pair has been provisioned.

## Your Details
- Developer ID: ${developerId}
- Q Assistant ID: ${qId}
- Onboarding Token: ${token}

## Setup Instructions

1. Install no-wing CLI:
   npm install -g no-wing

2. Complete onboarding:
   no-wing setup --token ${token}

3. Start working with your Q assistant:
   no-wing chat

## Your Q Assistant

Your Q assistant (${qId}) has been configured with:
- Appropriate IAM permissions for your role
- Monitoring and audit logging enabled
- Permission boundaries to ensure security
- Company-specific knowledge and patterns

## Support

If you need help:
- Run: no-wing help
- Contact: IT Support
- Documentation: https://github.com/your-org/no-wing

Happy coding with your AI development partner! 🚀
`;
  }

  /**
   * Generate unique developer ID from email
   */
  private generateDeveloperId(email: string): string {
    const username = email.split('@')[0];
    const timestamp = Date.now().toString().slice(-6);
    return `dev-${username}-${timestamp}`;
  }

  /**
   * Generate unique Q ID for the developer
   */
  private generateQId(developerId: string): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 8);
    return `q-${developerId.split('-')[1]}-${timestamp}-${random}`;
  }

  /**
   * Extract name from email address
   */
  private extractNameFromEmail(email: string): string {
    const username = email.split('@')[0];
    return username.split('.').map(part => 
      part.charAt(0).toUpperCase() + part.slice(1)
    ).join(' ');
  }

  // Storage methods (in real implementation, these would use a database)
  private async storeQIdentity(identity: QIdentity): Promise<void> {
    // TODO: Store in database
    console.log(`📝 Stored Q identity: ${identity.id}`);
  }

  private async storeOnboardingToken(token: OnboardingToken): Promise<void> {
    // TODO: Store in database
    console.log(`🎫 Created onboarding token: ${token.token}`);
  }

  private async storeDeveloperProfile(profile: DeveloperProfile): Promise<void> {
    // TODO: Store in database
    console.log(`👤 Created developer profile: ${profile.id}`);
  }
}
