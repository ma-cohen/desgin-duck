/**
 * Zustand store for managing requirements state.
 *
 * Fetches main.yaml and derived.yaml over HTTP (served by the built-in
 * Design Duck server), then parses and validates them using the shared
 * file-store parsing logic.
 *
 * Supports auto-reload via file watching:
 * - Primary: connects to the server's SSE endpoint (/events) for instant
 *   notifications when YAML files change on disk
 * - Fallback: polls at a configurable interval if SSE is unavailable
 */

import { create } from "zustand";
import {
  parseMainRequirementsYaml,
  parseDerivedRequirementsYaml,
} from "../infrastructure/yaml-parser";
import type {
  MainRequirement,
  DerivedRequirement,
} from "../domain/requirements/requirement";

/** Options for configuring file watching behavior. */
export interface WatchOptions {
  /**
   * Polling interval in milliseconds. Used as fallback when SSE is unavailable.
   * @default 2000
   */
  intervalMs?: number;
  /**
   * URL path prefix where YAML files are served.
   * @default "/requirements"
   */
  requirementsPath?: string;
  /**
   * SSE endpoint URL for real-time file change notifications.
   * @default "/events"
   */
  eventsUrl?: string;
}

export interface RequirementsState {
  /** Validated main (user-value) requirements. */
  mainRequirements: MainRequirement[];
  /** Validated derived (technical/enabling) requirements. */
  derivedRequirements: DerivedRequirement[];
  /** True while a loadFromFiles() call is in progress. */
  loading: boolean;
  /** Human-readable error message from the last failed load, or null. */
  error: string | null;
  /** Whether the store is actively watching for file changes. */
  watching: boolean;

  /**
   * Fetches main.yaml and derived.yaml from the given base path, parses them,
   * and replaces the current store state with the result.
   *
   * @param requirementsPath - URL path prefix where the YAML files are served.
   *   Defaults to "/requirements" (served by the built-in Design Duck server).
   */
  loadFromFiles: (requirementsPath?: string) => Promise<void>;

  /**
   * Starts watching for requirement file changes.
   * Connects to the server's SSE endpoint for instant notifications,
   * falls back to polling if SSE is unavailable.
   *
   * Safe to call multiple times — subsequent calls are no-ops while watching.
   */
  startWatching: (options?: WatchOptions) => void;

  /**
   * Stops watching for file changes and cleans up resources.
   * Safe to call multiple times or when not watching.
   */
  stopWatching: () => void;
}

// ---------------------------------------------------------------------------
// Internal state for the watcher (kept outside Zustand to avoid serialization)
// ---------------------------------------------------------------------------

let pollingTimer: ReturnType<typeof setInterval> | null = null;
let eventSource: EventSource | null = null;

/** Exported for testing — returns current internal watcher state. */
export function _getWatcherInternals() {
  return { pollingTimer, eventSource };
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useRequirementsStore = create<RequirementsState>()((set, get) => ({
  mainRequirements: [],
  derivedRequirements: [],
  loading: false,
  error: null,
  watching: false,

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

  startWatching: (options?: WatchOptions) => {
    if (get().watching) {
      console.log("[design-duck:store] Already watching, skipping");
      return;
    }

    const {
      intervalMs = 2000,
      requirementsPath = "/requirements",
      eventsUrl = "/events",
    } = options ?? {};

    console.log("[design-duck:store] Starting file watcher integration");

    // Try SSE first (available when served by the Design Duck UI server)
    if (typeof EventSource !== "undefined") {
      try {
        console.log(
          `[design-duck:store] Connecting to SSE endpoint: ${eventsUrl}`,
        );

        const es = new EventSource(eventsUrl);

        es.addEventListener("requirements-changed", () => {
          console.log(
            "[design-duck:store] SSE event received, reloading requirements",
          );
          get().loadFromFiles(requirementsPath);
        });

        es.addEventListener("connected", () => {
          console.log(
            "[design-duck:store] SSE connected to server",
          );
        });

        es.onerror = () => {
          console.warn(
            "[design-duck:store] SSE connection error, will retry automatically",
          );
        };

        eventSource = es;
        set({ watching: true });
        return;
      } catch {
        console.warn(
          "[design-duck:store] SSE failed, falling back to polling",
        );
      }
    }

    // Fallback: poll at regular intervals
    console.log(
      `[design-duck:store] SSE not available, polling every ${intervalMs}ms`,
    );

    pollingTimer = setInterval(() => {
      console.log("[design-duck:store] Polling for requirement changes");
      get().loadFromFiles(requirementsPath);
    }, intervalMs);

    set({ watching: true });
  },

  stopWatching: () => {
    if (!get().watching) {
      return;
    }

    console.log("[design-duck:store] Stopping file watcher integration");

    if (eventSource !== null) {
      eventSource.close();
      eventSource = null;
    }

    if (pollingTimer !== null) {
      clearInterval(pollingTimer);
      pollingTimer = null;
    }

    set({ watching: false });
  },
}));
