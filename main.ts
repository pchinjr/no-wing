#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-run --allow-net

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
      case "git-commit":
        await gitCommit();
        break;
      case "q":
        await runQ();
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
  git-commit   Make a Git commit as the agent
  q            Run Amazon Q with agent identity
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
  const args = parse(Deno.args);
  const config = await getConfig();
  
  // Get command to run (everything after "run")
  const commandIndex = Deno.args.indexOf("run");
  if (commandIndex === -1 || commandIndex === Deno.args.length - 1) {
    throw new Error("No command specified. Usage: no-wing run <command>");
  }
  
  const command = Deno.args.slice(commandIndex + 1);
  console.log(`Running as agent: ${config.agentName}`);
  console.log(`Command: ${command.join(" ")}`);
  
  try {
    // Import the IamRoleManager and AgentRunner
    const { IamRoleManager } = await import("./lib/iam.ts");
    const { AgentRunner } = await import("./lib/agent.ts");
    
    // Create role manager to get the role ARN
    const roleName = config.iamRolePattern.replace("{agent}", config.agentName);
    const roleManager = new IamRoleManager({
      roleName,
      agentName: config.agentName,
      permissionsBoundary: config.permissionsBoundary,
      policies: [],
    });
    
    // Get the role ARN
    const roleArn = await roleManager.getRoleArn();
    
    // Create agent runner
    const runner = new AgentRunner({
      agentName: config.agentName,
      command,
      roleArn,
      env: {
        // Add any additional environment variables here
      },
    });
    
    // Run the command
    const result = await runner.run();
    
    // Log the action
    await logAudit("run-command", {
      agent: config.agentName,
      command: command.join(" "),
      success: result.success,
    });
    
    // Output the result
    if (result.success) {
      console.log(result.output);
      console.log("✅ Command executed successfully");
    } else {
      console.error("❌ Command failed:");
      console.error(result.output);
      Deno.exit(1);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logAudit("run-command-failed", {
      agent: config.agentName,
      command: command.join(" "),
      error: errorMessage,
    });
    throw error;
  }
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

async function gitCommit() {
  const args = parse(Deno.args);
  const config = await getConfig();
  
  console.log("Starting git-commit command");
  console.log("Arguments:", args);
  
  // Get commit message
  const message = args.message || args.m;
  if (!message) {
    throw new Error("No commit message specified. Use --message or -m to provide one.");
  }
  
  // Get author name and email
  const authorName = args.name || `${config.agentName}-agent`;
  const authorEmail = args.email || `${config.agentName}@no-wing.local`;
  
  console.log(`Using agent: ${config.agentName}`);
  console.log(`Author name: ${authorName}`);
  console.log(`Author email: ${authorEmail}`);
  console.log(`Commit message: ${message}`);
  
  try {
    // Import the GitIdentityManager
    console.log("Importing GitIdentityManager...");
    const { GitIdentityManager } = await import("./lib/git.ts");
    
    // Create git identity manager
    console.log("Creating GitIdentityManager...");
    const gitManager = new GitIdentityManager({
      agentName: config.agentName,
      authorName,
      authorEmail,
    });
    
    // Make the commit
    console.log("Making commit...");
    const commitHash = await gitManager.commit(message);
    
    // Verify the authorship
    console.log("Verifying authorship...");
    const isVerified = await gitManager.verifyAuthorship(commitHash);
    
    // Log the action
    console.log("Logging audit...");
    await logAudit("git-commit", {
      agent: config.agentName,
      authorName,
      authorEmail,
      commitHash,
      verified: isVerified,
    });
    
    // Reset the identity after the commit
    console.log("Resetting identity...");
    await gitManager.resetIdentity();
    
    console.log(`✅ Commit ${commitHash} created successfully`);
    if (isVerified) {
      console.log("✅ Authorship verified");
    } else {
      console.log("❌ Authorship verification failed");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error in gitCommit:", errorMessage);
    
    if (error instanceof Error && error.stack) {
      console.error("Stack trace:", error.stack);
    }
    
    await logAudit("git-commit-failed", {
      agent: config.agentName,
      error: errorMessage,
    });
    throw error;
  }
}

async function runQ() {
  const args = parse(Deno.args);
  const config = await getConfig();
  
  // Check if agent is specified in args
  const agentName = args.agent || config.agentName;
  
  console.log(`Running Amazon Q as agent: ${agentName}`);
  
  try {
    // Import the GitIdentityManager
    const { GitIdentityManager } = await import("./lib/git.ts");
    
    // Create git identity manager with agent identity
    const authorName = `${agentName}-agent`;
    const authorEmail = `${agentName}@no-wing.local`;
    
    const gitManager = new GitIdentityManager({
      agentName,
      authorName,
      authorEmail,
    });
    
    // Set the Git identity for Amazon Q
    await gitManager.setIdentity();
    console.log(`Set Git identity for Amazon Q: ${authorName} <${authorEmail}>`);
    
    // Log the action
    await logAudit("q-start", {
      agent: agentName,
      authorName,
      authorEmail,
    });
    
    // Run Amazon Q CLI with a specific model to avoid hanging
    console.log("Starting Amazon Q...");
    
    // Extract any additional arguments to pass to q
    const qArgs = ["chat"];
    
    // Add model if specified
    if (args.model) {
      qArgs.push("--model", args.model);
    } else {
      // Default model
      qArgs.push("--model", "claude-3-5-sonnet-20240620");
    }
    
    // Add any additional arguments passed after 'q'
    const qIndex = Deno.args.indexOf("q");
    if (qIndex !== -1 && qIndex < Deno.args.length - 1) {
      // Filter out the --agent and --model arguments that we've already processed
      const remainingArgs = Deno.args.slice(qIndex + 1).filter((arg, i, arr) => {
        if (arg === "--agent" || arg === "--model") {
          // Skip this arg and the next one (the value)
          arr.splice(i + 1, 1);
          return false;
        }
        return true;
      });
      qArgs.push(...remainingArgs);
    }
    
    console.log(`Running q with args: ${qArgs.join(" ")}`);
    
    const qCommand = new Deno.Command("q", {
      args: qArgs,
      stdout: "inherit",
      stderr: "inherit",
      stdin: "inherit",
      env: {
        "GIT_AUTHOR_NAME": authorName,
        "GIT_AUTHOR_EMAIL": authorEmail,
        "GIT_COMMITTER_NAME": authorName,
        "GIT_COMMITTER_EMAIL": authorEmail,
        "NO_WING_AGENT": agentName,
      },
    });
    
    const qProcess = qCommand.spawn();
    const qStatus = await qProcess.status;
    
    // Reset the Git identity after Amazon Q exits
    await gitManager.resetIdentity();
    console.log("Reset Git identity");
    
    // Log the action
    await logAudit("q-exit", {
      agent: agentName,
      exitCode: qStatus.code,
    });
    
    if (qStatus.success) {
      console.log("✅ Amazon Q session completed successfully");
    } else {
      console.error(`❌ Amazon Q exited with code ${qStatus.code}`);
      Deno.exit(qStatus.code);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logAudit("q-failed", {
      agent: agentName,
      error: errorMessage,
    });
    throw error;
  }
}

if (import.meta.main) {
  main();
}
