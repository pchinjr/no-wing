// IAM Role Manager for no-wing

export interface IamRoleConfig {
  roleName: string;
  permissionsBoundary?: string;
  trustPolicy: Record<string, unknown>;
  inlinePolicies: Record<string, unknown>[];
}

export class IamRoleManager {
  constructor(private config: IamRoleConfig) {}

  createRole(): Promise<string> {
    if (!this.config.roleName) {
      return Promise.reject(new Error("Role name is required"));
    }
    // TODO(@pchinjr): #5 Implement AWS IAM role creation
    return Promise.reject(new Error("Not implemented"));
  }

  attachPolicies(): Promise<void> {
    if (!this.config.roleName) {
      return Promise.reject(new Error("Role name is required"));
    }
    // TODO(@pchinjr): #6 Implement policy attachment
    return Promise.reject(new Error("Not implemented"));
  }

  assumeRole(): Promise<Record<string, string>> {
    if (!this.config.roleName) {
      return Promise.reject(new Error("Role name is required"));
    }
    // TODO(@pchinjr): #7 Implement STS assume role
    return Promise.reject(new Error("Not implemented"));
  }

  deleteRole(): Promise<void> {
    if (!this.config.roleName) {
      return Promise.reject(new Error("Role name is required"));
    }
    // TODO(@pchinjr): #8 Implement role cleanup
    return Promise.reject(new Error("Not implemented"));
  }
}
