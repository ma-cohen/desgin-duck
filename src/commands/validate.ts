import { existsSync } from "node:fs";
import { join } from "node:path";
import { readMainRequirements, readDerivedRequirements } from "../infrastructure/file-store";

/**
 * Validates all requirement files in the desgin-duck/requirements/ directory.
 * Reports validation errors to stdout.
 * 
 * @param targetDir - Directory containing desgin-duck/requirements/ folder (defaults to cwd)
 * @returns void - exits with code 1 if validation fails, 0 if successful
 */
export function validate(targetDir: string = process.cwd()): void {
  const reqDir = join(targetDir, "desgin-duck", "requirements");

  if (process.env.DEBUG) {
    console.error("[design-duck:validate] targetDir:", targetDir);
    console.error("[design-duck:validate] reqDir:", reqDir);
  }

  // Check if requirements directory exists
  if (!existsSync(reqDir)) {
    console.error("Error: desgin-duck/requirements/ directory not found.");
    console.error("Run 'design-duck init' first to create the requirements structure.");
    process.exitCode = 1;
    return;
  }

  let hasErrors = false;
  let mainCount = 0;
  let derivedCount = 0;

  // Validate main.yaml
  console.log("Validating main.yaml...");
  try {
    const mainReqs = readMainRequirements(reqDir);
    mainCount = mainReqs.length;
    console.log(`✓ main.yaml is valid (${mainCount} requirements)`);
    
    if (process.env.DEBUG) {
      console.error(`[design-duck:validate] Successfully validated ${mainCount} main requirements`);
    }
  } catch (err) {
    hasErrors = true;
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`✗ main.yaml validation failed:`);
    console.error(`  ${msg}`);
    
    if (process.env.DEBUG) {
      console.error(`[design-duck:validate] main.yaml error:`, err);
    }
  }

  // Validate derived.yaml
  console.log("Validating derived.yaml...");
  try {
    const derivedReqs = readDerivedRequirements(reqDir);
    derivedCount = derivedReqs.length;
    console.log(`✓ derived.yaml is valid (${derivedCount} requirements)`);
    
    if (process.env.DEBUG) {
      console.error(`[design-duck:validate] Successfully validated ${derivedCount} derived requirements`);
    }
  } catch (err) {
    hasErrors = true;
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`✗ derived.yaml validation failed:`);
    console.error(`  ${msg}`);
    
    if (process.env.DEBUG) {
      console.error(`[design-duck:validate] derived.yaml error:`, err);
    }
  }

  // Summary
  console.log("");
  if (hasErrors) {
    console.error("Validation failed. Fix the errors above and try again.");
    process.exitCode = 1;
  } else {
    console.log(`All requirements are valid! (${mainCount} main, ${derivedCount} derived)`);
    process.exitCode = 0;
  }
}
