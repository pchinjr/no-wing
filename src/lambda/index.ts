import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { OnboardingOrchestrator } from './orchestrator';

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('no-wing Lambda handler invoked');
  console.log('Event:', JSON.stringify(event, null, 2));

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
  };

  try {
    // Handle different HTTP methods
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'CORS preflight' })
      };
    }

    if (event.httpMethod === 'GET') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'no-wing is running',
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        })
      };
    }

    if (event.httpMethod === 'POST') {
      return await handlePostRequest(event, headers);
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Lambda error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

async function handlePostRequest(
  event: APIGatewayProxyEvent,
  headers: Record<string, string>
): Promise<APIGatewayProxyResult> {
  const body = event.body ? JSON.parse(event.body) : {};
  const { action, name, env = 'dev', region = 'us-east-1' } = body;

  if (!name) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: 'Bad request',
        message: 'Name is required',
        qMessage: '🤖 Q: I need your name to get us both set up!'
      })
    };
  }

  const orchestrator = new OnboardingOrchestrator({ name, env, region });
  
  try {
    let result;
    
    switch (action) {
      case 'create-q-identity':
        await orchestrator.createQIdentity();
        result = { message: 'Q identity created successfully' };
        break;
        
      case 'create-roles':
        await orchestrator.createIAMRoles();
        result = { message: 'IAM roles created successfully' };
        break;
        
      case 'setup-credentials':
        await orchestrator.setupAWSCredentials();
        result = { message: 'Credentials configured successfully' };
        break;
        
      case 'authenticate-q':
        await orchestrator.authenticateQ();
        result = { message: 'Q authenticated successfully' };
        break;
        
      default:
        // Run all steps
        await orchestrator.createQIdentity();
        await orchestrator.createIAMRoles();
        await orchestrator.setupAWSCredentials();
        await orchestrator.authenticateQ();
        
        result = { 
          message: 'no-wing onboarding completed successfully',
          qMessage: '🤖 Q: We\'re all set up! I\'m ready to be your development teammate.',
          steps: [
            'Q identity created',
            'IAM roles configured', 
            'AWS credentials set up',
            'Q authenticated'
          ]
        };
        break;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Orchestrator error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Orchestration failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        qMessage: '🤖 Q: Something went wrong, but we can troubleshoot this together!'
      })
    };
  }
}
