// Agent runner for no-wing

export interface AgentConfig {
  agentName: string;
  roleArn?: string;
  command: string[];
  env?: Record<string, string>;
}

export class AgentRunner {
  private config: AgentConfig;
  
  // For testing purposes
  private envProvider: () => Record<string, string>;

  constructor(config: AgentConfig, envProvider?: () => Record<string, string>) {
    this.validateConfig(config);
    this.config = config;
    
    // Allow injecting an environment provider for testing
    this.envProvider = envProvider || (() => {
      try {
        return Deno.env.toObject();
      } catch {
        // Fallback for environments where env access is not allowed
        return {};
      }
    });
  }

  private validateConfig(config: AgentConfig): void {
    if (!config.agentName || typeof config.agentName !== "string") {
      throw new Error("Agent name is required and must be a string");
    }

    if (!Array.isArray(config.command) || config.command.length === 0) {
      throw new Error("Command is required and must be a non-empty array");
    }

    if (config.roleArn && typeof config.roleArn !== "string") {
      throw new Error("Role ARN must be a string if provided");
    }

    if (config.env && typeof config.env !== "object") {
      throw new Error("Environment variables must be an object if provided");
    }
  }

  /**
   * Prepares the environment for running the command
   */
  private async prepareEnvironment(): Promise<Record<string, string>> {
    const env: Record<string, string> = {
      ...this.envProvider(),
      ...this.config.env,
      NO_WING_AGENT: this.config.agentName,
    };

    if (this.config.roleArn) {
      // In a real implementation, this would use AWS STS to assume the role
      // and set the appropriate AWS credentials in the environment
      console.log(`Assuming role: ${this.config.roleArn}`);
      env.AWS_ROLE_ARN = this.config.roleArn;
    }

    return env;
  }

  /**
   * Runs the command as the agent
   */
  async run(): Promise<{ success: boolean; output: string }> {
    console.log(`Running as agent: ${this.config.agentName}`);
    console.log(`Command: ${this.config.command.join(" ")}`);

    const env = await this.prepareEnvironment();
    
    try {
      // In a real implementation, this would use Deno.Command to run the command
      // For now, we'll just simulate it
      console.log("Environment variables:");
      for (const [key, value] of Object.entries(env)) {
        if (key.startsWith("NO_WING_") || key.startsWith("AWS_")) {
          console.log(`- ${key}=${value}`);
        }
      }
      
      // Simulate command execution
      const output = `Simulated output for: ${this.config.command.join(" ")}`;
      return { success: true, output };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, output: errorMessage };
    }
  }
}
