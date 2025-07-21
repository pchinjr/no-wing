/**
 * Creates a temporary test environment
 */
export async function createTestEnv() {
  const testDir = await Deno.makeTempDir();
  const originalCwd = Deno.cwd();

  return {
    testDir,
    originalCwd,
    async cleanup() {
      await Deno.chdir(originalCwd);
      await Deno.remove(testDir, { recursive: true });
    },
  };
}

/**
 * Creates a mock AWS credentials file for testing
 */
export async function setupMockAwsCredentials(testDir: string) {
  const credentialsPath = `${testDir}/.aws/credentials`;
  await Deno.mkdir(`${testDir}/.aws`, { recursive: true });
  await Deno.writeTextFile(
    credentialsPath,
    `[default]
aws_access_key_id = test-key
aws_secret_access_key = test-secret
`
  );
  return credentialsPath;
}

/**
 * Creates a mock Git config for testing
 */
export async function setupMockGitConfig(testDir: string) {
  const configPath = `${testDir}/.gitconfig`;
  await Deno.writeTextFile(
    configPath,
    `[user]
    name = Test User
    email = test@example.com
`
  );
  return configPath;
}
