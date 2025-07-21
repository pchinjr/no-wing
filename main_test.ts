import { assertEquals, assertExists } from "https://deno.land/std/assert/mod.ts";
import { join, dirname, fromFileUrl } from "https://deno.land/std/path/mod.ts";
import { exists } from "https://deno.land/std/fs/mod.ts";

// Interface for configuration
interface NoWingConfig {
  agentName: string;
  iamRolePattern: string;
  auditLogPath: string;
  permissionsBoundary?: string | null;
}

// Path constants for testing
const TEST_NO_WING_DIR = ".no-wing-test";
const CONFIG_FILE = "config.json";
const TEMPLATE_FILE = "no-wing.template.json";

// Mock functions to test
async function getConfigDir(): Promise<string> {
  // For testing, use a temporary directory
  return join(Deno.cwd(), TEST_NO_WING_DIR);
}

async function ensureConfigDir(): Promise<string> {
  const configDir = await getConfigDir();
  await Deno.mkdir(configDir, { recursive: true });
  return configDir;
}

async function getTemplateConfig(): Promise<NoWingConfig> {
  // Get the directory where the script is located
  const scriptDir = dirname(fromFileUrl(import.meta.url));
  const templatePath = join(scriptDir, TEMPLATE_FILE);
  
  try {
    const templateText = await Deno.readTextFile(templatePath);
    return JSON.parse(templateText) as NoWingConfig;
  } catch (error) {
    // Handle the error properly with type checking
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error reading template file: ${errorMessage}`);
    
    // Fallback to hardcoded defaults if template file is not available
    return {
      agentName: "default-agent",
      iamRolePattern: "no-wing-{agent}-role",
      auditLogPath: "audit.log",
      permissionsBoundary: null,
    };
  }
}

// Clean up function for tests
async function cleanupTestDir() {
  const testDir = await getConfigDir();
  try {
    await Deno.remove(testDir, { recursive: true });
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      throw error;
    }
  }
}

Deno.test({
  name: "Configuration directory creation",
  async fn() {
    try {
      // Ensure we start clean
      await cleanupTestDir();
      
      // Test directory creation
      const configDir = await ensureConfigDir();
      
      // Verify directory exists
      const dirExists = await exists(configDir);
      assertEquals(dirExists, true, "Config directory should be created");
    } finally {
      // Clean up after test
      await cleanupTestDir();
    }
  },
});

Deno.test({
  name: "Configuration directory path",
  async fn() {
    const configDir = await getConfigDir();
    assertExists(configDir, "Config directory path should be defined");
    assertEquals(
      configDir.endsWith(TEST_NO_WING_DIR), 
      true, 
      `Config directory should end with ${TEST_NO_WING_DIR}`
    );
  },
});

Deno.test({
  name: "Template configuration loading",
  async fn() {
    const templateConfig = await getTemplateConfig();
    
    // Verify template config has expected properties
    assertExists(templateConfig.agentName, "Template config should have agentName");
    assertExists(templateConfig.iamRolePattern, "Template config should have iamRolePattern");
    assertExists(templateConfig.auditLogPath, "Template config should have auditLogPath");
    
    // Check if the template file exists
    const scriptDir = dirname(fromFileUrl(import.meta.url));
    const templatePath = join(scriptDir, TEMPLATE_FILE);
    const templateExists = await exists(templatePath);
    
    if (templateExists) {
      // If template file exists, verify the loaded config matches the file
      const templateText = await Deno.readTextFile(templatePath);
      const expectedConfig = JSON.parse(templateText);
      assertEquals(templateConfig, expectedConfig, "Template config should match file content");
    }
  },
});
