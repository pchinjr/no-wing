#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-run

import { GitIdentityManager } from "./lib/git.ts";

async function main() {
  console.log("Starting test-git-commit-2.ts");
  
  const gitManager = new GitIdentityManager({
    agentName: "another-agent",
    authorName: "Another Agent",
    authorEmail: "another-agent@no-wing.local",
  });
  
  try {
    // Make the commit
    console.log("Making commit...");
    const commitHash = await gitManager.commit("Test commit from another agent");
    
    // Verify the authorship
    console.log("Verifying authorship...");
    const isVerified = await gitManager.verifyAuthorship(commitHash);
    
    console.log(`Commit ${commitHash} created successfully`);
    if (isVerified) {
      console.log("Authorship verified");
    } else {
      console.log("Authorship verification failed");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    // Reset the identity
    await gitManager.resetIdentity();
  }
}

if (import.meta.main) {
  main();
}
