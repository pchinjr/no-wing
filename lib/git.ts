// Git identity manager for no-wing

export interface GitIdentityConfig {
  agentName: string;
  authorName: string;
  authorEmail: string;
  repository?: string;
}

export class GitIdentityManager {
  private config: GitIdentityConfig;

  constructor(config: GitIdentityConfig) {
    this.validateConfig(config);
    this.config = config;
  }

  private validateConfig(config: GitIdentityConfig): void {
    if (!config.agentName || typeof config.agentName !== "string") {
      throw new Error("Agent name is required and must be a string");
    }

    if (!config.authorName || typeof config.authorName !== "string") {
      throw new Error("Author name is required and must be a string");
    }

    if (!config.authorEmail || typeof config.authorEmail !== "string") {
      throw new Error("Author email is required and must be a string");
    }

    if (!this.isValidEmail(config.authorEmail)) {
      throw new Error("Author email must be a valid email address");
    }

    if (config.repository && typeof config.repository !== "string") {
      throw new Error("Repository path must be a string if provided");
    }
  }

  private isValidEmail(email: string): boolean {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Sets the Git identity for the agent
   */
  async setIdentity(): Promise<void> {
    console.log(`Setting Git identity for agent: ${this.config.agentName}`);
    console.log(`Author name: ${this.config.authorName}`);
    console.log(`Author email: ${this.config.authorEmail}`);

    // Set the Git identity using environment variables
    Deno.env.set("GIT_AUTHOR_NAME", this.config.authorName);
    Deno.env.set("GIT_AUTHOR_EMAIL", this.config.authorEmail);
    Deno.env.set("GIT_COMMITTER_NAME", this.config.authorName);
    Deno.env.set("GIT_COMMITTER_EMAIL", this.config.authorEmail);
    
    console.log("Environment variables set:");
    console.log(`GIT_AUTHOR_NAME: ${Deno.env.get("GIT_AUTHOR_NAME")}`);
    console.log(`GIT_AUTHOR_EMAIL: ${Deno.env.get("GIT_AUTHOR_EMAIL")}`);
    console.log(`GIT_COMMITTER_NAME: ${Deno.env.get("GIT_COMMITTER_NAME")}`);
    console.log(`GIT_COMMITTER_EMAIL: ${Deno.env.get("GIT_COMMITTER_EMAIL")}`);
  }

  /**
   * Makes a Git commit with the agent's identity
   */
  async commit(message: string): Promise<string> {
    // Ensure the identity is set
    await this.setIdentity();

    console.log(`Making commit as: ${this.config.authorName} <${this.config.authorEmail}>`);
    console.log(`Commit message: ${message}`);

    // Determine the repository path
    const repoPath = this.config.repository || ".";
    console.log(`Repository path: ${repoPath}`);

    // Check git status
    console.log("Checking git status...");
    const statusCommand = new Deno.Command("git", {
      args: ["status"],
      cwd: repoPath,
    });
    const statusResult = await statusCommand.output();
    console.log("Git status:");
    console.log(new TextDecoder().decode(statusResult.stdout));

    // Run git commands
    console.log("Adding files...");
    const addCommand = new Deno.Command("git", {
      args: ["add", "."],
      cwd: repoPath,
    });
    const addResult = await addCommand.output();
    if (!addResult.success) {
      const error = new TextDecoder().decode(addResult.stderr);
      console.error(`Failed to add files: ${error}`);
      throw new Error(`Failed to add files: ${error}`);
    }
    console.log("Files added successfully");

    // Check git status again
    console.log("Checking git status after add...");
    const statusCommand2 = new Deno.Command("git", {
      args: ["status"],
      cwd: repoPath,
    });
    const statusResult2 = await statusCommand2.output();
    console.log("Git status after add:");
    console.log(new TextDecoder().decode(statusResult2.stdout));

    console.log("Committing changes...");
    const commitCommand = new Deno.Command("git", {
      args: ["commit", "-m", message],
      cwd: repoPath,
      env: {
        "GIT_AUTHOR_NAME": this.config.authorName,
        "GIT_AUTHOR_EMAIL": this.config.authorEmail,
        "GIT_COMMITTER_NAME": this.config.authorName,
        "GIT_COMMITTER_EMAIL": this.config.authorEmail,
      },
    });
    const commitResult = await commitCommand.output();
    
    if (!commitResult.success) {
      const error = new TextDecoder().decode(commitResult.stderr);
      console.error(`Failed to commit: ${error}`);
      throw new Error(`Failed to commit: ${error}`);
    }

    const output = new TextDecoder().decode(commitResult.stdout);
    console.log("Commit output:");
    console.log(output);

    // Get the commit hash
    console.log("Getting commit hash...");
    const hashCommand = new Deno.Command("git", {
      args: ["rev-parse", "HEAD"],
      cwd: repoPath,
    });
    const hashResult = await hashCommand.output();
    
    if (!hashResult.success) {
      const error = new TextDecoder().decode(hashResult.stderr);
      console.error(`Failed to get commit hash: ${error}`);
      throw new Error(`Failed to get commit hash: ${error}`);
    }

    const commitHash = new TextDecoder().decode(hashResult.stdout).trim();
    console.log(`Commit hash: ${commitHash}`);
    return commitHash;
  }

  /**
   * Resets the Git identity to the default
   */
  async resetIdentity(): Promise<void> {
    console.log("Resetting Git identity");
    
    // Unset the Git identity environment variables
    Deno.env.delete("GIT_AUTHOR_NAME");
    Deno.env.delete("GIT_AUTHOR_EMAIL");
    Deno.env.delete("GIT_COMMITTER_NAME");
    Deno.env.delete("GIT_COMMITTER_EMAIL");
    
    console.log("Environment variables after reset:");
    console.log(`GIT_AUTHOR_NAME: ${Deno.env.get("GIT_AUTHOR_NAME") || "unset"}`);
    console.log(`GIT_AUTHOR_EMAIL: ${Deno.env.get("GIT_AUTHOR_EMAIL") || "unset"}`);
    console.log(`GIT_COMMITTER_NAME: ${Deno.env.get("GIT_COMMITTER_NAME") || "unset"}`);
    console.log(`GIT_COMMITTER_EMAIL: ${Deno.env.get("GIT_COMMITTER_EMAIL") || "unset"}`);
  }

  /**
   * Verifies the authorship of a commit
   */
  async verifyAuthorship(commitHash?: string): Promise<boolean> {
    // Determine the repository path
    const repoPath = this.config.repository || ".";

    // If no commit hash is provided, use HEAD
    const hash = commitHash || "HEAD";
    console.log(`Verifying authorship of commit: ${hash}`);

    // Get the commit author
    const authorCommand = new Deno.Command("git", {
      args: ["show", "-s", "--format=%an <%ae>", hash],
      cwd: repoPath,
    });
    const authorResult = await authorCommand.output();
    
    if (!authorResult.success) {
      const error = new TextDecoder().decode(authorResult.stderr);
      console.error(`Failed to get commit author: ${error}`);
      throw new Error(`Failed to get commit author: ${error}`);
    }

    const author = new TextDecoder().decode(authorResult.stdout).trim();
    const expectedAuthor = `${this.config.authorName} <${this.config.authorEmail}>`;
    
    console.log(`Commit author: ${author}`);
    console.log(`Expected author: ${expectedAuthor}`);
    
    return author === expectedAuthor;
  }
}
