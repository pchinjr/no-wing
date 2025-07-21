#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-net

import { parse } from "https://deno.land/std/flags/mod.ts";

interface NoWingConfig {
  agentName: string;
  iamRolePattern: string;
  auditLogPath: string;
  permissionsBoundary?: string;
}

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
    console.error("Error:", error.message);
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

async function initProject() {
  // TODO(@pchinjr): #1 Create state directory and copy config template
  const stateDir = "./state";
  await Deno.mkdir(stateDir, { recursive: true });
  throw new Error("Not implemented");
}

function assignRole() {
  // TODO(@pchinjr): #2 Implement AWS IAM role creation and assignment
  throw new Error("Not implemented");
}

function runAgent() {
  // TODO(@pchinjr): #3 Implement agent execution with identity
  throw new Error("Not implemented");
}

function showAudit() {
  // TODO(@pchinjr): #4 Implement audit log display
  throw new Error("Not implemented");
}

if (import.meta.main) {
  main();
}
