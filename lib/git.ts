// Git Identity Manager for no-wing

export interface GitIdentityConfig {
  name: string;
  email: string;
  signingKey?: string;
}

export class GitIdentityManager {
  constructor(private config: GitIdentityConfig) {}

  configureIdentity(): Promise<void> {
    if (!this.config.name || !this.config.email) {
      return Promise.reject(new Error("Git identity name and email are required"));
    }
    // TODO(@pchinjr): #9 Implement local git config
    return Promise.reject(new Error("Not implemented"));
  }

  commit(_message: string, _files: string[]): Promise<void> {
    if (!this.config.name || !this.config.email) {
      return Promise.reject(new Error("Git identity name and email are required"));
    }
    // TODO(@pchinjr): #10 Implement git commit with agent identity
    return Promise.reject(new Error("Not implemented"));
  }

  resetIdentity(): Promise<void> {
    if (!this.config.name || !this.config.email) {
      return Promise.reject(new Error("Git identity name and email are required"));
    }
    // TODO(@pchinjr): #11 Implement cleanup of git config
    return Promise.reject(new Error("Not implemented"));
  }
}
