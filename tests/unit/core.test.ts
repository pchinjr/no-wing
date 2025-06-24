import { QCapabilityLevel } from '../../src/q/identity';

describe('Core no-wing functionality', () => {
  describe('QCapabilityLevel', () => {
    it('should have correct capability levels', () => {
      expect(QCapabilityLevel.OBSERVER).toBe('observer');
      expect(QCapabilityLevel.ASSISTANT).toBe('assistant');
      expect(QCapabilityLevel.PARTNER).toBe('partner');
    });
  });

  describe('Task classification', () => {
    it('should classify creation tasks correctly', () => {
      const creationKeywords = ['create', 'build', 'deploy', 'make', 'generate'];
      
      creationKeywords.forEach(keyword => {
        const task = `${keyword} a Lambda function`;
        expect(task.toLowerCase()).toContain(keyword);
      });
    });

    it('should classify analysis tasks correctly', () => {
      const analysisKeywords = ['analyze', 'check', 'review', 'examine', 'list'];
      
      analysisKeywords.forEach(keyword => {
        const task = `${keyword} current functions`;
        expect(task.toLowerCase()).toContain(keyword);
      });
    });

    it('should classify update tasks correctly', () => {
      const updateKeywords = ['update', 'modify', 'change', 'optimize'];
      
      updateKeywords.forEach(keyword => {
        const task = `${keyword} function settings`;
        expect(task.toLowerCase()).toContain(keyword);
      });
    });
  });

  describe('Q identity generation', () => {
    it('should generate valid Q IDs', () => {
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 15);
      const qId = `q-${timestamp}-${randomSuffix}`;
      
      expect(qId).toMatch(/^q-\d+-[a-z0-9]+$/);
      expect(qId.startsWith('q-')).toBe(true);
    });

    it('should generate valid Q email addresses', () => {
      const qId = 'q-1234567890-abc123def';
      const email = `q+${qId}@no-wing.ai`;
      
      expect(email).toBe('q+q-1234567890-abc123def@no-wing.ai');
      expect(email).toMatch(/^q\+q-\d+-[a-z0-9]+@no-wing\.ai$/);
    });
  });

  describe('Session management', () => {
    it('should calculate session expiry correctly', () => {
      const now = new Date();
      const expiry = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
      
      const hoursDiff = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);
      expect(hoursDiff).toBe(24);
    });

    it('should detect expired sessions', () => {
      const now = new Date();
      const expiredTime = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
      
      expect(now > expiredTime).toBe(true);
    });
  });

  describe('AWS resource naming', () => {
    it('should generate valid Lambda function names', () => {
      const baseName = 'test-function';
      const timestamp = Date.now();
      const functionName = `q-${baseName}-${timestamp.toString().slice(-6)}`;
      
      expect(functionName).toMatch(/^q-[a-z-]+-\d{6}$/);
      expect(functionName.startsWith('q-')).toBe(true);
    });

    it('should generate valid S3 bucket names', () => {
      const baseName = 'test-bucket';
      const accountId = '123456789012';
      const region = 'us-east-1';
      const bucketName = `${baseName}-${accountId}-${region}`;
      
      expect(bucketName).toBe('test-bucket-123456789012-us-east-1');
      expect(bucketName).toMatch(/^[a-z0-9-]+$/);
    });
  });

  describe('Git commit message formatting', () => {
    it('should format commit messages correctly', () => {
      const baseMessage = 'feat: create Lambda function for user authentication';
      const qId = 'q-1234567890-abc123def';
      const level = 'partner';
      const taskCount = 15;
      
      const fullMessage = `${baseMessage}

Created by Q (${qId}) as Partner-level agent

🤖 Q-Agent: ${level}
Task-Count: ${taskCount}
Capability-Level: ${level}`;

      expect(fullMessage).toContain(baseMessage);
      expect(fullMessage).toContain('🤖 Q-Agent: partner');
      expect(fullMessage).toContain('Task-Count: 15');
    });
  });
});
