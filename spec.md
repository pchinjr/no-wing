here is a full **implementation design document** written for **Q** (or a developer agent) to execute. This version avoids specific code and instead clearly describes the *methods*, *flow*, and *architecture* needed to implement `no-wing` using Deno 2.4.2, with a focus on agent identity isolation, AWS access, code authorship, and auditability.

---

# 🪽 `no-wing`: Implementation Design Document

**Version**: 0.1
**Runtime**: Deno 2.4.2
**Agent**: AWS Q Developer CLI
**Objective**: Enable agentic developers to build, commit, and deploy with separate identities and least privilege, fully auditable.

---

## 🧩 Overview

`no-wing` is a Deno CLI tool that scaffolds, manages, and observes the behavior of developer agents such as Q. It equips them with:

* Their **own IAM role**
* A **dedicated authorship identity** for Git
* **Autonomous deployment permissions**
* A **persistent audit trail**

This enables Q to act as a *teammate*, not a ghostwriter—making decisions, executing commands, and logging its behavior with separation from the human developer.

---

## 🏗️ Architecture Overview

### Components

| Component               | Description                                                          |
| ----------------------- | -------------------------------------------------------------------- |
| CLI Entrypoint          | Accepts commands like `init`, `assign-role`, `run`, `audit`          |
| IAM Role Manager        | Provisions scoped IAM roles for agent use                            |
| Git Identity Manager    | Sets up commit identity separate from the dev                        |
| Deployment Orchestrator | Enables Q to deploy code using the role's credentials                |
| Audit Logger            | Tracks and persists agent actions locally and optionally in AWS logs |

---

## ⚙️ Command Descriptions & Methods

### 1. `init`

> Scaffolds the project for agent participation

* Create a local config file (e.g., `no-wing.json`) to define:

  * Agent name
  * IAM role name pattern
  * Audit log path
  * Optional permissions boundary
* Establish a local working directory (`state/`) to store role metadata and agent state

---

### 2. `assign-role`

> Sets up least-privilege AWS IAM access for the agent

**Steps:**

1. **Create IAM Role**

   * Use AWS IAM API to create a named role (e.g., `no-wing-agent-XYZ`)
   * Attach a trust policy allowing `q.amazonaws.com` or a designated principal to assume the role

2. **Attach Policies**

   * Apply least-privilege managed policies or inline policies based on the project context (e.g., deploy-only Lambda access)
   * Optionally apply a permissions boundary

3. **Store Role ARN**

   * Save the role metadata to the local `state/session.json`

4. **Output**:

   * The role's ARN
   * Temporary credentials (if assumed locally)
   * Time-limited access context

---

### 3. `run`

> Lets Q perform tasks under its own role and identity

**Modes of Operation:**

* **Local Execution**:

  * Configure AWS CLI to use the temporary credentials (e.g., via environment variables or shared config files)
  * Delegate to Q CLI commands under this identity

* **Project-Aware Execution**:

  * Give Q access to README, source tree, and goals
  * Allow it to modify code, install dependencies, generate IaC templates, etc.

* **Git Commit Identity**:

  * Configure Git to use the agent’s name and email
  * Make and commit changes as `[bot] q-agent` or similar

---

### 4. `audit`

> Record and report the agent's actions

**Audit Data Sources:**

* **Local logs**:

  * Append structured entries to `audit.log` (e.g., ISO timestamps + actions)
  * Include commit messages, deployment commands, errors

* **Optional cloud logging**:

  * Integrate CloudTrail tracking for IAM role usage
  * Optionally upload logs to S3 or CloudWatch for team access

**Audit Review Features:**

* Display latest entries
* Filter by action type (commit, deploy, error)
* Show identity used (agent role)

---

## 🔐 IAM Design Principles

* **Role-per-project**:

  * Each project gets a unique IAM role for the agent
* **Ephemeral Credentials**:

  * Prefer AssumeRole or STS session tokens with short duration
* **Scope by Task**:

  * Policies should match declared goals (e.g., deploy Lambda, but not delete resources)
* **No Access to Developer Credentials**:

  * Q should never assume or inherit the user’s AWS identity

---

## 🧠 Git Identity Isolation

Q should:

* Use a fixed bot identity (e.g., `Q Agent <q-agent@no-wing.local>`)
* Sign commits if desired
* Avoid modifying user Git config globally
* Tag or branch its own contributions for review if working collaboratively

---

## 🚀 Deployment Model

Q can deploy in two ways:

1. **AWS CLI**

   * Execute infrastructure commands using the assigned credentials
   * Log the output and errors

2. **IaC Template Execution**

   * Generate and deploy CloudFormation/CDK templates
   * Keep templates in version control with authored commits

---

## 🧾 Example Audit Trail Entries

| Timestamp (UTC)      | Action          | Context                                     |
| -------------------- | --------------- | ------------------------------------------- |
| 2025-07-21T14:43:00Z | Role Assumed    | arn\:aws\:iam::1234\:role/no-wing-agent-abc |
| 2025-07-21T14:44:10Z | Commit Authored | chore: agent generated deployment script    |
| 2025-07-21T14:45:30Z | Deployed Lambda | Function name: `q-echo`                     |

---

## 🔮 Future Enhancements

* **Web Dashboard** for session and audit visualization
* **Zelkova-style policy simulation** before attaching roles
* **Integration with GitHub Actions or CI/CD** to use Q agents as deployers
* **Memory state sync**: Let agents persist reasoning between sessions

---

## ✅ Definition of Done (MVP)

* Agent can:

  * Bootstrap project
  * Assume role and deploy resources
  * Author code and commits
  * Be audited separately
* Dev retains:

  * Total control and visibility
  * Separation of responsibility
  * A tamper-proof audit trail

