/**
 * Renders a list of main requirements using RequirementCard.
 * Handles empty, loading, and error states.
 */

import type { MainRequirement } from "../domain/requirements/requirement";
import { RequirementCard } from "./RequirementCard";

export interface RequirementListProps {
  requirements: MainRequirement[];
  loading: boolean;
  error: string | null;
}

export function RequirementList({ requirements, loading, error }: RequirementListProps) {
  console.debug(
    `[design-duck:ui] Rendering RequirementList: ${requirements.length} items, loading=${loading}`,
  );

  if (loading) {
    return (
      <div className="py-12 text-center" data-testid="requirements-loading">
        <p className="text-sm text-gray-500">Loading requirements…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-lg border border-red-200 bg-red-50 px-5 py-4"
        data-testid="requirements-error"
      >
        <p className="text-sm font-medium text-red-800">
          Failed to load requirements
        </p>
        <p className="mt-1 text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (requirements.length === 0) {
    return (
      <div className="py-12 text-center" data-testid="requirements-empty">
        <p className="text-sm text-gray-500">
          No requirements found. Add requirements to{" "}
          <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono">
            requirements/main.yaml
          </code>{" "}
          to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4" data-testid="requirements-list">
      {requirements.map((req) => (
        <RequirementCard key={req.id} requirement={req} />
      ))}
    </div>
  );
}
