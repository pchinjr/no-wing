# No-Wing

Agent Identity Manager for AWS and Git operations.

## Overview

No-Wing is a tool for managing agent identities when working with AWS and Git. It allows you to:

- Create and assign IAM roles to agents
- Run commands as an agent with specific IAM roles
- Make Git commits with agent identities
- Run Amazon Q with agent identities
- Track agent activities in an audit log

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/no-wing.git
   cd no-wing
   ```

2. Make sure you have Deno installed:
   ```bash
   curl -fsSL https://deno.land/x/install/install.sh | sh
   ```

3. Initialize the project:
   ```bash
   deno task start init
   ```

## Usage

### Initialize the project

```bash
deno task start init
```

This creates a `.no-wing` directory with configuration and audit log files.

### Assign an IAM role to an agent

```bash
deno task start assign-role
```

### Run a command as an agent

```bash
deno task start run -- aws s3 ls
```

### Make a Git commit as an agent

```bash
deno task start git-commit --message "Your commit message" --name "Agent Name" --email "agent@example.com"
```

### Run Amazon Q with agent identity

```bash
./no-wing-q
```

This will run Amazon Q with the agent identity specified in your configuration.

#### Options for no-wing-q

```bash
./no-wing-q --help
```

```
Usage: no-wing-q [OPTIONS]

Run Amazon Q with no-wing agent identity

Options:
  --agent NAME     Specify the agent name (overrides config)
  --model MODEL    Specify the model to use (default: claude-3-5-sonnet-20240620)
  --help           Show this help message

Any additional options will be passed to the 'q chat' command

Examples:
  no-wing-q
  no-wing-q --agent dev-agent
  no-wing-q --model claude-3-haiku-20240307
```

### View the audit log

```bash
deno task start audit
```

## Configuration

The configuration is stored in `.no-wing/config.json`. You can edit this file to change the default agent name, IAM role pattern, and other settings.

## How Amazon Q Integration Works

When you run `./no-wing-q`, the following happens:

1. The agent identity is set up with the specified name (from config or `--agent` option)
2. Git environment variables are set to use the agent identity for any Git operations
3. Amazon Q is launched with the specified model
4. When Amazon Q makes Git commits, they will be attributed to the agent identity
5. After the Amazon Q session ends, the Git identity is reset to your default identity
6. All actions are logged in the audit log

This allows you to clearly track which commits were made by Amazon Q acting as a specific agent.

## License

MIT
