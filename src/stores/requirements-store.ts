/**
 * Zustand store for managing requirements state.
 *
 * Fetches main.yaml and derived.yaml over HTTP (served by Vite dev server),
 * then parses and validates them using the shared file-store parsing logic.
 */

import { create } from "zustand";
import {
  parseMainRequirementsYaml,
  parseDerivedRequirementsYaml,
} from "../infrastructure/file-store";
import type {
  MainRequirement,
  DerivedRequirement,
} from "../domain/requirements/requirement";

export interface RequirementsState {
  /** Validated main (user-value) requirements. */
  mainRequirements: MainRequirement[];
  /** Validated derived (technical/enabling) requirements. */
  derivedRequirements: DerivedRequirement[];
  /** True while a loadFromFiles() call is in progress. */
  loading: boolean;
  /** Human-readable error message from the last failed load, or null. */
  error: string | null;

  /**
   * Fetches main.yaml and derived.yaml from the given base path, parses them,
   * and replaces the current store state with the result.
   *
   * @param requirementsPath - URL path prefix where the YAML files are served.
   *   Defaults to "/requirements" (Vite dev server serves from project root).
   */
  loadFromFiles: (requirementsPath?: string) => Promise<void>;
}

export const useRequirementsStore = create<RequirementsState>()((set) => ({
  mainRequirements: [],
  derivedRequirements: [],
  loading: false,
  error: null,

  loadFromFiles: async (requirementsPath = "/requirements") => {
    console.log("[design-duck:store] Loading requirements...");
    set({ loading: true, error: null });

    try {
      const [mainRes, derivedRes] = await Promise.all([
        fetch(`${requirementsPath}/main.yaml`),
        fetch(`${requirementsPath}/derived.yaml`),
      ]);

      if (!mainRes.ok) {
        throw new Error(
          `Failed to fetch main.yaml: ${mainRes.status} ${mainRes.statusText}`,
        );
      }
      if (!derivedRes.ok) {
        throw new Error(
          `Failed to fetch derived.yaml: ${derivedRes.status} ${derivedRes.statusText}`,
        );
      }

      const mainContent = await mainRes.text();
      const derivedContent = await derivedRes.text();

      const mainRequirements = parseMainRequirementsYaml(mainContent);
      const derivedRequirements = parseDerivedRequirementsYaml(derivedContent);

      set({
        mainRequirements,
        derivedRequirements,
        loading: false,
        error: null,
      });

      console.log(
        `[design-duck:store] Loaded ${mainRequirements.length} main and ${derivedRequirements.length} derived requirements`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        `[design-duck:store] Failed to load requirements: ${message}`,
      );
      set({ loading: false, error: message });
    }
  },
}));
