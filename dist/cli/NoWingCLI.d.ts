#!/usr/bin/env node
export declare class NoWingCLI {
    private program;
    private credentialManager;
    private clientFactory;
    private configManager;
    private roleManager;
    private permissionElevator;
    private auditLogger;
    private deploymentManager;
    constructor();
    initialize(): Promise<void>;
    private setupCommands;
    run(argv: string[]): Promise<void>;
    private handleSetup;
    private handleStatus;
    private handleDeploy;
    private handleRollback;
    private handleCredentialSwitch;
    private handleCredentialTest;
    private handleWhoAmI;
    private handleListRoles;
    private handleTestRole;
    private handlePermissionRequests;
    private handleAuditEvents;
    private handleAuditReport;
    private handleVerifyCloudTrail;
    private handleConfigShow;
    private handleConfigValidate;
    private handleConfigMigrate;
    private parseTags;
}
export { NoWingCLI };
//# sourceMappingURL=NoWingCLI.d.ts.map