/**
 * Pure YAML parsing functions for requirement files.
 *
 * These functions are environment-agnostic — they work in both Node/Bun
 * and the browser. They accept raw YAML strings and return validated
 * requirement objects.
 *
 * This module intentionally has NO Node.js imports (no node:fs, node:path)
 * so it can be safely bundled for browser use by Vite.
 */

import { load as parseYaml } from "js-yaml";
import type { MainRequirement, DerivedRequirement } from "../domain/requirements/requirement";
import {
  assertMainRequirement,
  assertDerivedRequirement,
} from "../domain/requirements/requirement";

/**
 * Parses a YAML string into validated MainRequirement objects.
 *
 * @param content - Raw YAML string from main.yaml
 * @returns Array of validated main requirements
 * @throws Error if malformed YAML or validation fails
 */
export function parseMainRequirementsYaml(content: string): MainRequirement[] {
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

  return requirements;
}

/**
 * Parses a YAML string into validated DerivedRequirement objects.
 *
 * @param content - Raw YAML string from derived.yaml
 * @returns Array of validated derived requirements
 * @throws Error if malformed YAML or validation fails
 */
export function parseDerivedRequirementsYaml(content: string): DerivedRequirement[] {
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

  return requirements;
}
