#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-net

import { parse } from "https://deno.land/std/flags/mod.ts";
import { join, dirname, fromFileUrl } from "https://deno.land/std/path/mod.ts";

interface NoWingConfig {
  agentName: string;
  iamRolePattern: string;
  auditLogPath: string;
  permissionsBoundary?: string | null;
}

// Path constants
const NO_WING_DIR = ".no-wing";
const CONFIG_FILE = "config.json";
const TEMPLATE_FILE = "no-wing.template.json";

async function main() {
  const args = parse(Deno.args);
  const command = args._[0]?.toString() || "help";

  try {
    switch (command) {
      case "init":
        await initProject();
        break;
      case "assign-role":
        await assignRole();
        break;
      case "run":
        await runAgent();
        break;
      case "audit":
        await showAudit();
        break;
      case "help":
      default:
        showHelp();
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error:", errorMessage);
    Deno.exit(1);
  }
}

function showHelp() {
  console.log(`
🪽 no-wing - Agent Identity Manager

USAGE:
  no-wing <command> [options]

COMMANDS:
  init         Initialize a new no-wing project
  assign-role  Create and assign an IAM role for the agent
  run          Execute commands as the agent
  audit        View audit logs
  help         Show this help message

For more information, see: https://github.com/your-repo/no-wing
`);
}

async function getConfigDir(): Promise<string> {
  // Get the current working directory
  const cwd = Deno.cwd();
  const configDir = join(cwd, NO_WING_DIR);
  return configDir;
}

async function ensureConfigDir(): Promise<string> {
  const configDir = await getConfigDir();
  await Deno.mkdir(configDir, { recursive: true });
  return configDir;
}

async function getTemplateConfig(): Promise<NoWingConfig> {
  // Get the directory where the script is located
  const scriptDir = dirname(fromFileUrl(import.meta.url));
  const templatePath = join(scriptDir, TEMPLATE_FILE);
  
  try {
    const templateText = await Deno.readTextFile(templatePath);
    return JSON.parse(templateText) as NoWingConfig;
  } catch (error) {
    // Handle the error properly with type checking
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error reading template file: ${errorMessage}`);
    
    // Fallback to hardcoded defaults if template file is not available
    return {
      agentName: "default-agent",
      iamRolePattern: "no-wing-{agent}-role",
      auditLogPath: "audit.log",
      permissionsBoundary: null,
    };
  }
}

async function getConfig(): Promise<NoWingConfig> {
  const configDir = await getConfigDir();
  const configPath = join(configDir, CONFIG_FILE);
  
  try {
    const configText = await Deno.readTextFile(configPath);
    return JSON.parse(configText) as NoWingConfig;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      // Config file doesn't exist yet, use template
      return await getTemplateConfig();
    }
    throw error;
  }
}

async function saveConfig(config: NoWingConfig): Promise<void> {
  const configDir = await ensureConfigDir();
  const configPath = join(configDir, CONFIG_FILE);
  await Deno.writeTextFile(configPath, JSON.stringify(config, null, 2));
}

async function logAudit(action: string, details: Record<string, unknown>): Promise<void> {
  const config = await getConfig();
  const configDir = await getConfigDir();
  const auditPath = join(configDir, config.auditLogPath);
  
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    action,
    ...details,
  };
  
  const logLine = JSON.stringify(logEntry) + "\n";
  await Deno.writeTextFile(auditPath, logLine, { append: true });
}

async function initProject() {
  console.log("Initializing no-wing project...");
  
  // Create .no-wing directory
  const configDir = await ensureConfigDir();
  console.log(`Created configuration directory: ${configDir}`);
  
  // Get template configuration
  const templateConfig = await getTemplateConfig();
  
  // Save configuration from template
  await saveConfig(templateConfig);
  console.log("Created configuration from template");
  
  // Initialize empty audit log
  const auditPath = join(configDir, templateConfig.auditLogPath);
  await Deno.writeTextFile(auditPath, "");
  console.log(`Initialized audit log at: ${auditPath}`);
  
  // Log the initialization
  await logAudit("init", { message: "Project initialized" });
  
  console.log("✅ Project initialized successfully");
}

async function assignRole() {
  const config = await getConfig();
  console.log(`Using agent: ${config.agentName}`);
  
  // Get role name from pattern
  const roleName = config.iamRolePattern.replace("{agent}", config.agentName);
  console.log(`Role name: ${roleName}`);
  
  try {
    // Import the IamRoleManager
    const { IamRoleManager } = await import("./lib/iam.ts");
    
    // Create role manager with configuration
    const roleManager = new IamRoleManager({
      roleName,
      agentName: config.agentName,
      permissionsBoundary: config.permissionsBoundary,
      policies: [
        // Default read-only policy
        "arn:aws:iam::aws:policy/ReadOnlyAccess",
      ],
    });
    
    // Create the role
    const roleArn = await roleManager.createRole();
    console.log(`Created role: ${roleArn}`);
    
    // Attach policies
    await roleManager.attachPolicies();
    console.log("Attached policies to role");
    
    // Log the action
    await logAudit("assign-role", { 
      agent: config.agentName,
      roleName,
      roleArn,
    });
    
    console.log("✅ Role assigned successfully");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logAudit("assign-role-failed", { 
      agent: config.agentName,
      roleName,
      error: errorMessage,
    });
    throw error;
  }
}

async function runAgent() {
  // TODO(@pchinjr): #3 Implement agent execution with identity
  const config = await getConfig();
  console.log(`Running as agent: ${config.agentName}`);
  
  // Log the attempt
  await logAudit("run-agent-attempt", { agent: config.agentName });
  
  throw new Error("Agent execution not implemented yet");
}

async function showAudit() {
  // Read and display the audit log
  const config = await getConfig();
  const configDir = await getConfigDir();
  const auditPath = join(configDir, config.auditLogPath);
  
  try {
    const auditContent = await Deno.readTextFile(auditPath);
    if (!auditContent.trim()) {
      console.log("Audit log is empty");
      return;
    }
    
    const entries = auditContent
      .trim()
      .split("\n")
      .map(line => JSON.parse(line));
    
    console.log("Audit Log:");
    console.log("==========");
    
    for (const entry of entries) {
      const { timestamp, action, ...details } = entry;
      console.log(`[${timestamp}] ${action}`);
      for (const [key, value] of Object.entries(details)) {
        console.log(`  ${key}: ${value}`);
      }
      console.log("----------");
    }
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      console.log("No audit log found. Run 'no-wing init' to create one.");
    } else {
      throw error;
    }
  }
}

if (import.meta.main) {
  main();
}
