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

    // Run git commands
    const addCommand = new Deno.Command("git", {
      args: ["add", "."],
      cwd: repoPath,
    });
    const addResult = await addCommand.output();
    if (!addResult.success) {
      throw new Error(`Failed to add files: ${new TextDecoder().decode(addResult.stderr)}`);
    }

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
      throw new Error(`Failed to commit: ${new TextDecoder().decode(commitResult.stderr)}`);
    }

    const output = new TextDecoder().decode(commitResult.stdout);
    console.log(output);

    // Get the commit hash
    const hashCommand = new Deno.Command("git", {
      args: ["rev-parse", "HEAD"],
      cwd: repoPath,
    });
    const hashResult = await hashCommand.output();
    
    if (!hashResult.success) {
      throw new Error(`Failed to get commit hash: ${new TextDecoder().decode(hashResult.stderr)}`);
    }

    const commitHash = new TextDecoder().decode(hashResult.stdout).trim();
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
  }

  /**
   * Verifies the authorship of a commit
   */
  async verifyAuthorship(commitHash?: string): Promise<boolean> {
    // Determine the repository path
    const repoPath = this.config.repository || ".";

    // If no commit hash is provided, use HEAD
    const hash = commitHash || "HEAD";

    // Get the commit author
    const authorCommand = new Deno.Command("git", {
      args: ["show", "-s", "--format=%an <%ae>", hash],
      cwd: repoPath,
    });
    const authorResult = await authorCommand.output();
    
    if (!authorResult.success) {
      throw new Error(`Failed to get commit author: ${new TextDecoder().decode(authorResult.stderr)}`);
    }

    const author = new TextDecoder().decode(authorResult.stdout).trim();
    const expectedAuthor = `${this.config.authorName} <${this.config.authorEmail}>`;
    
    console.log(`Commit author: ${author}`);
    console.log(`Expected author: ${expectedAuthor}`);
    
    return author === expectedAuthor;
  }
}
