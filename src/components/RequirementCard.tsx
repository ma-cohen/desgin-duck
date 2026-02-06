/**
 * Renders a single main requirement as a card with priority and status badges.
 */

import type { MainRequirement, Priority, Status } from "../domain/requirements/requirement";

const PRIORITY_STYLES: Record<Priority, string> = {
  high: "bg-red-100 text-red-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-green-100 text-green-800",
};

const STATUS_STYLES: Record<Status, string> = {
  draft: "bg-gray-100 text-gray-700",
  review: "bg-blue-100 text-blue-800",
  approved: "bg-emerald-100 text-emerald-800",
};

export interface RequirementCardProps {
  requirement: MainRequirement;
}

export function RequirementCard({ requirement }: RequirementCardProps) {
  const { id, description, userValue, priority, status } = requirement;

  console.debug(`[design-duck:ui] Rendering RequirementCard: ${id}`);

  return (
    <article
      className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
      data-testid={`requirement-card-${id}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium tracking-wide text-gray-400 uppercase">
          {id}
        </span>
        <div className="flex gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${PRIORITY_STYLES[priority]}`}
            data-testid={`priority-badge-${id}`}
          >
            {priority}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status]}`}
            data-testid={`status-badge-${id}`}
          >
            {status}
          </span>
        </div>
      </div>

      <h3 className="mb-2 text-sm font-semibold leading-snug text-gray-900">
        {description}
      </h3>

      <p className="text-sm leading-relaxed text-gray-500">
        {userValue}
      </p>
    </article>
  );
}
