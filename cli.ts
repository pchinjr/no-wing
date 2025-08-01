#!/usr/bin/env -S deno run --unstable --allow-run --allow-read --allow-write --allow-env

import { parse } from "https://deno.land/std@0.224.0/flags/mod.ts";
import { runTask } from "./tools/taskRunner.ts";

const { agent = "local", trust = false, help = false } = parse(Deno.args, {
  boolean: ["trust", "help"],
  string: ["agent"],
  alias: { a: "agent", t: "trust", h: "help" },
  default: { agent: "local" },
});

if (help) {
  console.log(`
Usage: deno run -A cli.ts [options]

  -a, --agent <local|q>    Choose agent (default: local)
  -t, --trust              Trust all tools for Q CLI runs
  -h, --help               Show this help
`);
  Deno.exit(0);
}

if (agent === "q") {
  console.log("🧠 Using Q Developer CLI (auto-launching MCP tools)");
} else {
  console.log("🧠 Using local agent (no Q Developer CLI)");
}

await runTask({
  intentPath: "intent.yml",
  outputPath: "workspace/output.ts",
  agent: agent === "q" ? "q" : "local",
  trust: trust === true,
});
