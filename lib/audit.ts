// Audit Logger for no-wing

export interface AuditEntry {
  timestamp: string;
  action: string;
  context: Record<string, unknown>;
  identity: string;
}

export class AuditLogger {
  constructor(private logPath: string) {}

  async log(action: string, context: Record<string, unknown>): Promise<void> {
    const entry: AuditEntry = {
      timestamp: new Date().toISOString(),
      action,
      context,
      // TODO(@pchinjr): #12 Make identity dynamic based on current agent
      identity: "q-agent",
    };

    // TODO(@pchinjr): #13 Implement log writing
    await this.validateLogPath();
    console.log(JSON.stringify(entry, null, 2));
    throw new Error("Not implemented");
  }

  async query(_options: {
    startTime?: Date;
    endTime?: Date;
    action?: string;
  }): Promise<AuditEntry[]> {
    // TODO(@pchinjr): #14 Implement log querying
    await this.validateLogPath();
    throw new Error("Not implemented");
  }

  private async validateLogPath(): Promise<void> {
    try {
      await Deno.stat(this.logPath);
    } catch {
      throw new Error("Audit log path does not exist");
    }
  }
}
