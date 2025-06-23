/**
 * Demo Lambda Function for Q Interaction
 * 
 * A simple Lambda function that Q can:
 * - Observer Level: Read and analyze
 * - Assistant Level: Update configuration and metadata
 * - Partner Level: Create new versions and features
 */

export interface DemoEvent {
  action: string;
  data?: any;
  qLevel?: string;
}

export interface DemoResponse {
  statusCode: number;
  body: string;
  metadata: {
    version: string;
    lastModified: string;
    qInteractions: number;
  };
}

// Simple in-memory state (in real implementation, this would be in DynamoDB)
let functionState = {
  version: '1.0.0',
  description: 'Demo function for Q interaction testing',
  lastModified: new Date().toISOString(),
  qInteractions: 0,
  features: ['basic-response'],
  config: {
    timeout: 30,
    memory: 128,
    environment: 'demo'
  }
};

export const handler = async (event: DemoEvent): Promise<DemoResponse> => {
  console.log('Demo function invoked:', JSON.stringify(event, null, 2));
  
  // Increment Q interaction counter
  functionState.qInteractions++;
  functionState.lastModified = new Date().toISOString();

  try {
    switch (event.action) {
      case 'get-info':
        return handleGetInfo();
      
      case 'get-logs':
        return handleGetLogs();
      
      case 'update-config':
        return handleUpdateConfig(event.data);
      
      case 'add-feature':
        return handleAddFeature(event.data);
      
      case 'health-check':
        return handleHealthCheck();
      
      default:
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: 'Unknown action',
            availableActions: ['get-info', 'get-logs', 'update-config', 'add-feature', 'health-check']
          }),
          metadata: {
            version: functionState.version,
            lastModified: functionState.lastModified,
            qInteractions: functionState.qInteractions
          }
        };
    }
  } catch (error) {
    console.error('Error in demo function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      metadata: {
        version: functionState.version,
        lastModified: functionState.lastModified,
        qInteractions: functionState.qInteractions
      }
    };
  }
};

/**
 * Observer Level: Get basic function information
 */
function handleGetInfo(): DemoResponse {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Demo function information retrieved',
      info: {
        description: functionState.description,
        version: functionState.version,
        features: functionState.features,
        config: functionState.config,
        stats: {
          qInteractions: functionState.qInteractions,
          lastModified: functionState.lastModified
        }
      }
    }),
    metadata: {
      version: functionState.version,
      lastModified: functionState.lastModified,
      qInteractions: functionState.qInteractions
    }
  };
}

/**
 * Observer Level: Get function logs (simulated)
 */
function handleGetLogs(): DemoResponse {
  const simulatedLogs = [
    {
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      level: 'INFO',
      message: 'Function started successfully'
    },
    {
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      level: 'INFO',
      message: `Q interaction #${functionState.qInteractions - 1}`
    },
    {
      timestamp: new Date(Date.now() - 900000).toISOString(),
      level: 'DEBUG',
      message: 'Processing demo request'
    },
    {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message: `Current Q interaction #${functionState.qInteractions}`
    }
  ];

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Function logs retrieved',
      logs: simulatedLogs,
      analysis: {
        totalLogs: simulatedLogs.length,
        errorCount: 0,
        averageResponseTime: '45ms',
        recommendation: 'Function is performing well, no issues detected'
      }
    }),
    metadata: {
      version: functionState.version,
      lastModified: functionState.lastModified,
      qInteractions: functionState.qInteractions
    }
  };
}

/**
 * Assistant Level: Update function configuration
 */
function handleUpdateConfig(data: any): DemoResponse {
  if (!data || !data.config) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Configuration data required',
        example: { config: { timeout: 60, memory: 256 } }
      }),
      metadata: {
        version: functionState.version,
        lastModified: functionState.lastModified,
        qInteractions: functionState.qInteractions
      }
    };
  }

  // Update configuration
  functionState.config = { ...functionState.config, ...data.config };
  functionState.lastModified = new Date().toISOString();

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Configuration updated successfully',
      oldConfig: functionState.config,
      newConfig: data.config,
      updatedAt: functionState.lastModified
    }),
    metadata: {
      version: functionState.version,
      lastModified: functionState.lastModified,
      qInteractions: functionState.qInteractions
    }
  };
}

/**
 * Partner Level: Add new feature to function
 */
function handleAddFeature(data: any): DemoResponse {
  if (!data || !data.feature) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Feature name required',
        example: { feature: 'user-authentication' }
      }),
      metadata: {
        version: functionState.version,
        lastModified: functionState.lastModified,
        qInteractions: functionState.qInteractions
      }
    };
  }

  // Add new feature
  if (!functionState.features.includes(data.feature)) {
    functionState.features.push(data.feature);
    functionState.version = incrementVersion(functionState.version);
    functionState.lastModified = new Date().toISOString();
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Feature added successfully',
      feature: data.feature,
      allFeatures: functionState.features,
      newVersion: functionState.version,
      updatedAt: functionState.lastModified
    }),
    metadata: {
      version: functionState.version,
      lastModified: functionState.lastModified,
      qInteractions: functionState.qInteractions
    }
  };
}

/**
 * Health check endpoint
 */
function handleHealthCheck(): DemoResponse {
  return {
    statusCode: 200,
    body: JSON.stringify({
      status: 'healthy',
      uptime: 'simulated',
      qInteractions: functionState.qInteractions,
      version: functionState.version
    }),
    metadata: {
      version: functionState.version,
      lastModified: functionState.lastModified,
      qInteractions: functionState.qInteractions
    }
  };
}

/**
 * Helper function to increment version number
 */
function incrementVersion(version: string): string {
  const parts = version.split('.');
  const patch = parseInt(parts[2] || '0') + 1;
  return `${parts[0]}.${parts[1]}.${patch}`;
}
