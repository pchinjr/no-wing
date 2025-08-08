// run-q-with-validation.ts
import { validatePlan } from "./plan.ts";
import { parse } from "https://deno.land/std@0.224.0/yaml/mod.ts";

async function runQWithIntent(intentPath = "intent.yml", outputPath = "workspace/output.ts") {
  // Read the intent
  const intentText = await Deno.readTextFile(intentPath);
  const intent = parse(intentText) as {
    goal: string;
    constraints?: string[];
    acceptance_criteria?: string[];
  };

  console.log("🎯 Intent:", intent.goal);
  console.log("🧠 Agent: Q CLI with MCP tools");

  // Launch Q CLI
  const p = new Deno.Command("q", {
    args: ["chat"],  // Remove --no-interactive and --trust-all-tools
    stdin: "piped",
    stdout: "piped",
    stderr: "inherit",
  });

  const proc = p.spawn();

  // Send intent as natural language
  const prompt = `${intent.goal}. Use the fs_write tool to write it to "./${outputPath}"\n`;

  const encoder = new TextEncoder();
  const writer = proc.stdin.getWriter();
  await writer.write(encoder.encode(prompt));
  await writer.close();

  // Read Q's response
  const output = await new Response(proc.stdout).text();
  console.log("\n📝 Q CLI Response:");
  console.log(output);

  // Validate the output
  try {
    const agentOutput = await Deno.readTextFile(outputPath);
    console.log("\n🔍 Validating output against intent...");
    
    const { passed, results } = validatePlan(intent, agentOutput, outputPath, true);

    // Save validation results
    await Deno.writeTextFile(
      "workspace/plan.json",
      JSON.stringify({ passed, results }, null, 2),
    );

    console.log(passed ? "\n🎉 All constraints passed!" : "\n⚠️ Some constraints failed.");
    
    if (!passed) {
      console.log("📋 Validation details saved to workspace/plan.json");
      return false;
    }
    
    return true;
  } catch (err) {
    console.error("❌ Validation error:", err.message);
    return false;
  }
}

// Run if called directly
if (import.meta.main) {
  const success = await runQWithIntent();
  Deno.exit(success ? 0 : 1);
}
