/**
 * Renders main requirements with nested derived requirements showing traceability.
 * Each main requirement card expands to show which derived (technical) requirements
 * trace back to it via the derivedFrom link.
 */

import type { MainRequirement, DerivedRequirement } from "../domain/requirements/requirement";
import { RequirementCard } from "./RequirementCard";

/** Style map for derived-requirement category badges. */
const CATEGORY_STYLES: Record<string, string> = {
  technical: "bg-purple-100 text-purple-800",
  operational: "bg-indigo-100 text-indigo-800",
  quality: "bg-teal-100 text-teal-800",
  constraint: "bg-orange-100 text-orange-800",
};

const PRIORITY_STYLES: Record<string, string> = {
  high: "bg-red-100 text-red-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-green-100 text-green-800",
};

export interface RequirementTreeProps {
  mainRequirements: MainRequirement[];
  derivedRequirements: DerivedRequirement[];
  loading: boolean;
  error: string | null;
}

/**
 * Builds a lookup from main requirement id to its derived requirements.
 */
function buildDerivedMap(
  derivedRequirements: DerivedRequirement[],
): Map<string, DerivedRequirement[]> {
  const map = new Map<string, DerivedRequirement[]>();
  for (const derived of derivedRequirements) {
    for (const parentId of derived.derivedFrom) {
      const list = map.get(parentId) ?? [];
      list.push(derived);
      map.set(parentId, list);
    }
  }
  return map;
}

function DerivedRequirementItem({ derived }: { derived: DerivedRequirement }) {
  const categoryStyle = CATEGORY_STYLES[derived.category] ?? "bg-gray-100 text-gray-700";
  const priorityStyle = PRIORITY_STYLES[derived.priority] ?? "bg-gray-100 text-gray-700";

  console.debug(`[design-duck:ui] Rendering DerivedRequirementItem: ${derived.id}`);

  return (
    <div
      className="rounded-md border border-gray-100 bg-gray-50 px-4 py-3"
      data-testid={`derived-item-${derived.id}`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium tracking-wide text-gray-400 uppercase">
          {derived.id}
        </span>
        <div className="flex gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${categoryStyle}`}
            data-testid={`category-badge-${derived.id}`}
          >
            {derived.category}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${priorityStyle}`}
            data-testid={`priority-badge-${derived.id}`}
          >
            {derived.priority}
          </span>
        </div>
      </div>

      <p className="text-sm font-medium text-gray-800">{derived.description}</p>
      <p className="mt-1 text-xs leading-relaxed text-gray-500">
        {derived.rationale}
      </p>
    </div>
  );
}

export function RequirementTree({
  mainRequirements,
  derivedRequirements,
  loading,
  error,
}: RequirementTreeProps) {
  console.debug(
    `[design-duck:ui] Rendering RequirementTree: ${mainRequirements.length} main, ${derivedRequirements.length} derived`,
  );

  if (loading) {
    return (
      <div className="py-12 text-center" data-testid="tree-loading">
        <p className="text-sm text-gray-500">Loading requirements…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-lg border border-red-200 bg-red-50 px-5 py-4"
        data-testid="tree-error"
      >
        <p className="text-sm font-medium text-red-800">
          Failed to load requirements
        </p>
        <p className="mt-1 text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (mainRequirements.length === 0) {
    return (
      <div className="py-12 text-center" data-testid="tree-empty">
        <p className="text-sm text-gray-500">
          No requirements found. Add requirements to{" "}
          <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono">
            desgin-duck/requirements/main.yaml
          </code>{" "}
          to get started.
        </p>
      </div>
    );
  }

  const derivedMap = buildDerivedMap(derivedRequirements);

  return (
    <div className="grid gap-6" data-testid="requirement-tree">
      {mainRequirements.map((mainReq) => {
        const children = derivedMap.get(mainReq.id) ?? [];

        return (
          <div key={mainReq.id} data-testid={`tree-node-${mainReq.id}`}>
            <RequirementCard requirement={mainReq} />

            {children.length > 0 && (
              <div
                className="ml-6 mt-2 space-y-2 border-l-2 border-gray-200 pl-4"
                data-testid={`derived-list-${mainReq.id}`}
              >
                <p className="text-xs font-medium tracking-wide text-gray-400 uppercase">
                  {`Derived Requirements (${children.length})`}
                </p>
                {children.map((derived) => (
                  <DerivedRequirementItem key={derived.id} derived={derived} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
