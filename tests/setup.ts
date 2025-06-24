// Global test setup
import { jest } from '@jest/globals';

// Mock AWS SDK clients globally
jest.mock('@aws-sdk/client-lambda');
jest.mock('@aws-sdk/client-iam');
jest.mock('@aws-sdk/client-cloudwatch-logs');
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/client-sts');

// Mock file system operations
jest.mock('fs/promises');

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.AWS_REGION = 'us-east-1';
process.env.AWS_ACCOUNT_ID = '123456789012';

// Global test timeout
jest.setTimeout(30000);
