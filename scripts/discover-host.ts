// scripts/discover-host.ts
const command = new Deno.Command("sh", {
  args: ["-c", "ip route | grep default"],
  stdout: "piped",
});
const { stdout } = await command.output();

const decoded = new TextDecoder().decode(stdout);
const match = decoded.match(/default via (\d+\.\d+\.\d+\.\d+)/);

if (!match) {
  console.error("❌ Could not find Windows host IP.");
  Deno.exit(1);
}

const hostIP = match[1];
console.log(`✅ Discovered host IP: ${hostIP}`);

let envText = "";
try {
  envText = await Deno.readTextFile(".env");
} catch {
  console.log("🆕 .env does not exist, creating it.");
}

const lines = envText.split("\n").filter((line) => line.trim() !== "");
const filtered = lines.filter((line) => !line.startsWith("LOCAL_AGENT_HOST="));
filtered.push(`LOCAL_AGENT_HOST=${hostIP}`);

await Deno.writeTextFile(".env", filtered.join("\n") + "\n");
console.log("✅ Updated .env with LOCAL_AGENT_HOST");
