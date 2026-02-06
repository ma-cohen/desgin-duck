/**
 * File system operations for reading requirement YAML files.
 *
 * Read functions (readMainRequirements, readDerivedRequirements) use
 * filesystem I/O and are Node/Bun only.
 *
 * Pure parsing functions are re-exported from ./yaml-parser for
 * backward compatibility.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  parseMainRequirementsYaml,
  parseDerivedRequirementsYaml,
} from "./yaml-parser";
import type { MainRequirement, DerivedRequirement } from "../domain/requirements/requirement";

// Re-export pure parsers for backward compatibility
export { parseMainRequirementsYaml, parseDerivedRequirementsYaml } from "./yaml-parser";

export interface RequirementsFile<T> {
  requirements: T[];
}

// ---------------------------------------------------------------------------
// Filesystem readers (Node/Bun only)
// ---------------------------------------------------------------------------

/**
 * Reads and parses main.yaml into validated MainRequirement objects.
 *
 * @param requirementsDir - Path to the requirements/ directory
 * @returns Array of validated main requirements
 * @throws Error if file not found, malformed YAML, or validation fails
 */
export function readMainRequirements(requirementsDir: string): MainRequirement[] {
  const filePath = join(requirementsDir, "main.yaml");

  if (process.env.DEBUG) {
    console.error(`[file-store] Reading main requirements from: ${filePath}`);
  }

  try {
    const content = readFileSync(filePath, "utf-8");

    if (process.env.DEBUG) {
      console.error(`[file-store] Read ${content.length} bytes from main.yaml`);
    }

    const requirements = parseMainRequirementsYaml(content);

    if (process.env.DEBUG) {
      console.error(`[file-store] Successfully parsed ${requirements.length} main requirements`);
    }

    return requirements;
  } catch (err) {
    if (err instanceof Error && "code" in err && err.code === "ENOENT") {
      throw new Error(`main.yaml not found at ${filePath}`);
    }
    throw err;
  }
}

/**
 * Reads and parses derived.yaml into validated DerivedRequirement objects.
 *
 * @param requirementsDir - Path to the requirements/ directory
 * @returns Array of validated derived requirements
 * @throws Error if file not found, malformed YAML, or validation fails
 */
export function readDerivedRequirements(requirementsDir: string): DerivedRequirement[] {
  const filePath = join(requirementsDir, "derived.yaml");

  if (process.env.DEBUG) {
    console.error(`[file-store] Reading derived requirements from: ${filePath}`);
  }

  try {
    const content = readFileSync(filePath, "utf-8");

    if (process.env.DEBUG) {
      console.error(`[file-store] Read ${content.length} bytes from derived.yaml`);
    }

    const requirements = parseDerivedRequirementsYaml(content);

    if (process.env.DEBUG) {
      console.error(`[file-store] Successfully parsed ${requirements.length} derived requirements`);
    }

    return requirements;
  } catch (err) {
    if (err instanceof Error && "code" in err && err.code === "ENOENT") {
      throw new Error(`derived.yaml not found at ${filePath}`);
    }
    throw err;
  }
}
