import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { OnboardingOrchestrator } from './orchestrator';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
  };

  try {
    const { httpMethod, path, body } = event;
    
    // Handle preflight requests
    if (httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: ''
      };
    }

    // Parse request body
    const requestBody = body ? JSON.parse(body) : {};
    
    // Route requests based on path
    switch (path) {
      case '/onboard':
        return await handleOnboarding(requestBody, headers);
      
      case '/health':
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            status: 'healthy',
            message: '🤖 Q: Control plane is operational!',
            timestamp: new Date().toISOString()
          })
        };
      
      default:
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            error: 'Not Found',
            message: `Path ${path} not found`
          })
        };
    }
    
  } catch (error) {
    console.error('Lambda error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
        qMessage: '🤖 Q: Something went wrong, but I\'m learning from this error!'
      })
    };
  }
};

async function handleOnboarding(
  requestBody: any, 
  headers: Record<string, string>
): Promise<APIGatewayProxyResult> {
  
  const { name, repo, env = 'dev', region = 'us-east-1', step } = requestBody;
  
  if (!name || !repo) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: 'Bad Request',
        message: 'Name and repo are required',
        qMessage: '🤖 Q: I need your name and repo to get us both set up!'
      })
    };
  }

  const orchestrator = new OnboardingOrchestrator({ name, repo, env, region });
  
  try {
    let result;
    
    switch (step) {
      case 'create-roles':
        await orchestrator.createRoles();
        result = { message: 'IAM roles created successfully' };
        break;
        
      case 'setup-credentials':
        await orchestrator.setupCredentials();
        result = { message: 'Credentials configured successfully' };
        break;
        
      case 'authenticate-q':
        await orchestrator.authenticateQ();
        result = { message: 'Q authenticated successfully' };
        break;
        
      case 'setup-github':
        await orchestrator.setupGitHub();
        result = { message: 'GitHub integration configured successfully' };
        break;
        
      case 'setup-pipeline':
        await orchestrator.setupPipeline();
        result = { message: 'Deployment pipeline configured successfully' };
        break;
        
      default:
        // Run all steps
        await orchestrator.createRoles();
        await orchestrator.setupCredentials();
        await orchestrator.authenticateQ();
        await orchestrator.setupGitHub();
        await orchestrator.setupPipeline();
        
        result = { 
          message: 'Complete onboarding successful',
          qMessage: `🤖 Q: Welcome ${name}! We're now officially teammates. Let's build something amazing together!`
        };
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        ...result,
        developer: name,
        repo,
        environment: env,
        timestamp: new Date().toISOString()
      })
    };
    
  } catch (error) {
    console.error('Onboarding error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Onboarding Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        qMessage: '🤖 Q: The onboarding hit a snag, but I\'m analyzing the issue to help fix it!',
        step
      })
    };
  }
}
