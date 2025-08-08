#!/usr/bin/env -S deno run -A

// demo-no-wing-flow.ts
// Demonstrates the complete No-Wing flow: Intent → Attempt → Human Approval → Validation

console.log("🦈 No-Wing Demo: Intent → Attempt → Approval → Validation\n");

console.log("📋 Step 1: Reading Intent");
const intentText = await Deno.readTextFile("intent.yml");
console.log("Intent:", intentText.split('\n')[0]); // Show first line

console.log("\n🤖 Step 2: Agent Attempts Task");
console.log("Launching Q CLI agent...");

const p = new Deno.Command("q", {
  args: ["chat"],
  stdin: "piped",
  stdout: "piped", 
  stderr: "piped",
});

const proc = p.spawn();

// Send the intent
const prompt = `Write a TypeScript function called getCatPhotos that returns 3 cat image URLs. Use the fs_write tool to write it to "./workspace/output.ts"\n`;

const encoder = new TextEncoder();
const writer = proc.stdin.getWriter();
await writer.write(encoder.encode(prompt));

// Simulate human approval after a brief delay
setTimeout(async () => {
  console.log("\n👤 Step 3: Human Reviews & Approves");
  console.log("Human sees: 'fs_write to workspace/output.ts'");
  console.log("Human decision: APPROVE (y)");
  
  // Send 'y' to approve the tool usage
  await writer.write(encoder.encode("y\n"));
  await writer.close();
}, 3000);

// Capture the output
const [stdout, stderr] = await Promise.all([
  new Response(proc.stdout).text(),
  new Response(proc.stderr).text(),
]);

console.log("\n📝 Agent Output:");
console.log(stdout);

if (stderr) {
  console.log("Stderr:", stderr);
}

console.log("\n✅ Step 4: Validation");
try {
  const output = await Deno.readTextFile("workspace/output.ts");
  console.log("Generated code preview:");
  console.log(output.split('\n').slice(0, 5).join('\n') + "...");
  
  console.log("\n🎉 No-Wing Flow Complete!");
  console.log("✓ Agent attempted task");
  console.log("✓ Human approved action"); 
  console.log("✓ Code was generated");
  console.log("✓ Ready for validation");
  
} catch (err) {
  console.log("❌ Validation failed:", err.message);
}
