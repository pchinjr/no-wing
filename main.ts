async function gitCommit() {
  const args = parse(Deno.args);
  const config = await getConfig();
  
  // Get commit message
  const message = args.message || args.m;
  if (!message) {
    throw new Error("No commit message specified. Use --message or -m to provide one.");
  }
  
  // Get author name and email
  const authorName = args.name || `${config.agentName}-agent`;
  const authorEmail = args.email || `${config.agentName}@no-wing.local`;
  
  try {
    // Import the GitIdentityManager
    const { GitIdentityManager } = await import("./lib/git.ts");
    
    // Create git identity manager
    const gitManager = new GitIdentityManager({
      agentName: config.agentName,
      authorName,
      authorEmail,
    });
    
    // Make the commit
    console.log(`Making commit as agent: ${config.agentName}`);
    console.log(`Author: ${authorName} <${authorEmail}>`);
    console.log(`Message: ${message}`);
    
    const commitHash = await gitManager.commit(message);
    
    // Verify the authorship
    const isVerified = await gitManager.verifyAuthorship(commitHash);
    
    // Log the action
    await logAudit("git-commit", {
      agent: config.agentName,
      authorName,
      authorEmail,
      commitHash,
      verified: isVerified,
    });
    
    // Reset the identity after the commit
    await gitManager.resetIdentity();
    
    console.log(`✅ Commit ${commitHash} created successfully`);
    if (isVerified) {
      console.log("✅ Authorship verified");
    } else {
      console.log("❌ Authorship verification failed");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logAudit("git-commit-failed", {
      agent: config.agentName,
      error: errorMessage,
    });
    throw error;
  }
}
