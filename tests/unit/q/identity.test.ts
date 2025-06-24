import { QIdentityManager, QCapabilityLevel, QIdentity } from '../../../src/q/identity';

describe('QIdentityManager', () => {
  let identityManager: QIdentityManager;
  const testConfigPath = './.no-wing/test-q-identity.json';

  beforeEach(() => {
    identityManager = new QIdentityManager(testConfigPath);
  });

  describe('createIdentity', () => {
    it('should create a new Q identity with Observer level', async () => {
      const identity = await identityManager.createIdentity('TestQ');

      expect(identity.name).toBe('TestQ');
      expect(identity.level).toBe(QCapabilityLevel.OBSERVER);
      expect(identity.successfulTasks).toBe(0);
      expect(identity.failedTasks).toBe(0);
      expect(identity.permissions).toContain('lambda:GetFunction');
      expect(identity.permissions).toContain('lambda:ListFunctions');
      expect(identity.sessionExpiry).toBeDefined();
      
      // Check session expiry is ~24 hours from now
      const expiry = new Date(identity.sessionExpiry);
      const now = new Date();
      const hoursDiff = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);
      expect(hoursDiff).toBeGreaterThan(23);
      expect(hoursDiff).toBeLessThan(25);
    });

    it('should generate unique IDs', async () => {
      const identity1 = await identityManager.createIdentity('TestQ1');
      const identity2 = await identityManager.createIdentity('TestQ2');

      expect(identity1.id).not.toBe(identity2.id);
      expect(identity1.id).toMatch(/^q-\d+-[a-z0-9]+$/);
      expect(identity2.id).toMatch(/^q-\d+-[a-z0-9]+$/);
    });
  });

  describe('canPerformTask', () => {
    beforeEach(async () => {
      // Create an identity for testing
      await identityManager.createIdentity('TestQ');
    });

    it('should allow Observer tasks for Observer level Q', () => {
      const canPerform = identityManager.canPerformTask('analysis', QCapabilityLevel.OBSERVER);
      expect(canPerform).toBe(true);
    });

    it('should deny Partner tasks for Observer level Q', () => {
      const canPerform = identityManager.canPerformTask('creation', QCapabilityLevel.PARTNER);
      expect(canPerform).toBe(false);
    });
  });

  describe('generateId', () => {
    it('should generate valid Q IDs', () => {
      const id1 = (identityManager as any).generateId();
      const id2 = (identityManager as any).generateId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^q-\d+-[a-z0-9]+$/);
      expect(id2).toMatch(/^q-\d+-[a-z0-9]+$/);
    });
  });
});
