/**
 * File system operations for reading and writing requirement YAML files.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { load as parseYaml } from "js-yaml";
import type { MainRequirement, DerivedRequirement } from "../domain/requirements/requirement";
import {
  assertMainRequirement,
  assertDerivedRequirement,
} from "../domain/requirements/requirement";

export interface RequirementsFile<T> {
  requirements: T[];
}

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

    const parsed = parseYaml(content) as unknown;
    
    if (!parsed || typeof parsed !== "object") {
      throw new Error("main.yaml must contain a YAML object");
    }

    const file = parsed as Record<string, unknown>;
    
    if (!Array.isArray(file.requirements)) {
      throw new Error("main.yaml must have a 'requirements' array");
    }

    const requirements: MainRequirement[] = [];
    
    for (let i = 0; i < file.requirements.length; i++) {
      const raw = file.requirements[i];
      try {
        assertMainRequirement(raw);
        requirements.push(raw);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(`main.yaml requirement at index ${i}: ${msg}`);
      }
    }

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

    const parsed = parseYaml(content) as unknown;
    
    if (!parsed || typeof parsed !== "object") {
      throw new Error("derived.yaml must contain a YAML object");
    }

    const file = parsed as Record<string, unknown>;
    
    if (!Array.isArray(file.requirements)) {
      throw new Error("derived.yaml must have a 'requirements' array");
    }

    const requirements: DerivedRequirement[] = [];
    
    for (let i = 0; i < file.requirements.length; i++) {
      const raw = file.requirements[i];
      try {
        assertDerivedRequirement(raw);
        requirements.push(raw);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(`derived.yaml requirement at index ${i}: ${msg}`);
      }
    }

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
