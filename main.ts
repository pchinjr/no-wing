async function gitCommit() {
  const args = parse(Deno.args);
  const config = await getConfig();
  
  console.log("Starting git-commit command");
  console.log("Arguments:", args);
  
  // Get commit message
  const message = args.message || args.m;
  if (!message) {
    throw new Error("No commit message specified. Use --message or -m to provide one.");
  }
  
  // Get author name and email
  const authorName = args.name || `${config.agentName}-agent`;
  const authorEmail = args.email || `${config.agentName}@no-wing.local`;
  
  console.log(`Using agent: ${config.agentName}`);
  console.log(`Author name: ${authorName}`);
  console.log(`Author email: ${authorEmail}`);
  console.log(`Commit message: ${message}`);
  
  try {
    // Import the GitIdentityManager
    console.log("Importing GitIdentityManager...");
    const { GitIdentityManager } = await import("./lib/git.ts");
    
    // Create git identity manager
    console.log("Creating GitIdentityManager...");
    const gitManager = new GitIdentityManager({
      agentName: config.agentName,
      authorName,
      authorEmail,
    });
    
    // Make the commit
    console.log("Making commit...");
    const commitHash = await gitManager.commit(message);
    
    // Verify the authorship
    console.log("Verifying authorship...");
    const isVerified = await gitManager.verifyAuthorship(commitHash);
    
    // Log the action
    console.log("Logging audit...");
    await logAudit("git-commit", {
      agent: config.agentName,
      authorName,
      authorEmail,
      commitHash,
      verified: isVerified,
    });
    
    // Reset the identity after the commit
    console.log("Resetting identity...");
    await gitManager.resetIdentity();
    
    console.log(`✅ Commit ${commitHash} created successfully`);
    if (isVerified) {
      console.log("✅ Authorship verified");
    } else {
      console.log("❌ Authorship verification failed");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error in gitCommit:", errorMessage);
    
    if (error instanceof Error && error.stack) {
      console.error("Stack trace:", error.stack);
    }
    
    await logAudit("git-commit-failed", {
      agent: config.agentName,
      error: errorMessage,
    });
    throw error;
  }
}
