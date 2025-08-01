// scripts/write-q-config.ts
const config = `
[mcp.servers.no_wing]
url = "http://localhost:8000"

[mcp.tools.fs_guard]
server = "no_wing"
description = "Safely write to files in the workspace directory"
input_schema = '''
{
  "type": "object",
  "properties": {
    "path": { "type": "string" },
    "content": { "type": "string" }
  },
  "required": ["path", "content"]
}
'''
annotations = ["safe"]
`;

await Deno.writeTextFile(".q-no-wing.toml", config.trim());
console.log("✅ Q config written to .q-no-wing.toml");
