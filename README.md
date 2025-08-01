# 🦈 No-Wing

**No-Wing** is a framework for managing artificial agents as secure, auditable digital employees.

This MVP implements a minimal **MCP-compatible server** that:
- Accepts an `intent.yml` describing a developer goal
- Routes the intent to a local or remote agent (e.g. LM Studio)
- Saves the agent's output to `workspace/`
- Shuts down cleanly with `Ctrl+C`

---

## 🧠 Philosophy

> Agents should work like employees: they get a task, execute within clear boundaries, and are held accountable for the results.

No-Wing provides a common lifecycle for any artificial capable of generating or transforming code—whether it's an API, CLI tool, or IDE plugin.

---

## 🧱 Project Structure

```

no-wing/
├── server.ts             # HTTP server (MCP-compatible)
├── agents/
│   └── local-agent.ts    # Calls a local LM Studio endpoint
├── scripts/
│   └── discover-host.ts  # Auto-discovers host IP for LOCAL\_AGENT\_HOST
├── intent.yml            # Developer goal and constraints
├── .env                  # Local agent IP (auto-generated)
└── workspace/            # Agent output directory

````

---

## 🚀 Getting Started

### 1. Start LM Studio
- Enable: **“Serve on local network”**
- Load your model (e.g. `deepseek-r1-distill-qwen-7b`)
- Ensure it’s listening on port `1234`

---

### 2. Discover Host IP from WSL2

If using WSL2 and LM Studio is on Windows:

```bash
deno run --allow-run=sh --allow-read --allow-write scripts/discover-host.ts
````

This writes `LOCAL_AGENT_HOST=...` to your `.env` file automatically.

---

### 3. Define Your Intent

Edit `intent.yml`:

```yaml
goal: "Create a TypeScript function that adds two numbers"
constraints:
  - must use TypeScript
  - must include inline documentation
acceptance_criteria:
  - output written to workspace/output.ts
```

---

### 4. Run the No-Wing Server

```bash
deno run --allow-net --allow-read --allow-write --allow-env server.ts
```

Then:

```bash
curl -X POST http://localhost:8000 -H "Content-Type: application/json" -d '{}'
```

Check `workspace/output.ts` for the result.

---

## ✅ Features

* Graceful shutdown on `Ctrl+C`
* Uses `.env` to configure local agent host
* Compatible with LM Studio, GPT, Claude, or custom agents
* Agent output is validated and logged for alignment

---

## 🔜 Roadmap

* [ ] `no-wing plan`: Validate output against intent
* [ ] `no-wing commit`: Attribute work to agent identity
* [ ] `no-wing deploy`: Deploy with least-privilege credentials
* [ ] Multi-agent plugin system
* [ ] LLM OS-style syscall sandboxing

---