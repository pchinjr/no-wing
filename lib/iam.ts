// IAM Role Manager for no-wing

export interface IamRoleConfig {
  roleName: string;
  permissionsBoundary?: string;
  trustPolicy: Record<string, unknown>;
  inlinePolicies: Record<string, unknown>[];
}

export class IamRoleManager {
  constructor(private config: IamRoleConfig) {}

  // Methods are marked as returning Promise as they will use AWS API calls in the future
  createRole(): Promise<string> {
    // TODO(@pchinjr): #5 Implement AWS IAM role creation
    this.validateConfig();
    return Promise.reject(new Error("Not implemented"));
  }

  attachPolicies(): Promise<void> {
    // TODO(@pchinjr): #6 Implement policy attachment
    this.validateConfig();
    return Promise.reject(new Error("Not implemented"));
  }

  assumeRole(): Promise<Record<string, string>> {
    // TODO(@pchinjr): #7 Implement STS assume role
    this.validateConfig();
    return Promise.reject(new Error("Not implemented"));
  }

  deleteRole(): Promise<void> {
    // TODO(@pchinjr): #8 Implement role cleanup
    this.validateConfig();
    return Promise.reject(new Error("Not implemented"));
  }

  private validateConfig(): void {
    if (!this.config.roleName) {
      throw new Error("Role name is required");
    }
  }
}
