import { UserButton } from "@clerk/clerk-react";
import { KanbanBoard } from "../../components/organisms/KanbanBoard/KanbanBoard";
import {
  useJobApplications,
  useReorderJobApplications,
} from "../../hooks/useJobApplications";
import type { ReorderResult } from "../../components/organisms/KanbanBoard/reorderApplications";

const QUERY_ERROR_FIELDS = ["name", "code", "message"] as const;

function formatQueryError(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return "Unknown query error";
  }

  const errorRecord = error as Record<string, unknown>;
  const details = QUERY_ERROR_FIELDS.flatMap((field) => {
    const value = errorRecord[field];
    return typeof value === "string" && value.length > 0 ? [value] : [];
  });

  return details.length > 0 ? details.join(" · ") : "Unknown query error";
}

export function KanbanBoardPage() {
  const applicationsQuery = useJobApplications();
  const reorderApplications = useReorderJobApplications();

  function handleReorder(result: ReorderResult) {
    reorderApplications.mutate(result);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[96rem]">
        <header className="mb-8 flex items-start justify-between gap-6">
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-blue-600">
              Job Buddy
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Applications
            </h1>
            <p className="mt-2 text-slate-600">
              Track every opportunity from saved to final decision.
            </p>
          </div>
          <UserButton />
        </header>

        {applicationsQuery.isPending ? (
          <p role="status" className="text-slate-600">
            Loading applications…
          </p>
        ) : applicationsQuery.isError ? (
          <div role="alert" className="text-red-700">
            <p>Could not load applications. Please try again.</p>
            {import.meta.env.DEV ? (
              <code className="mt-2 block whitespace-pre-wrap text-xs text-slate-600">
                {formatQueryError(applicationsQuery.error)}
              </code>
            ) : null}
          </div>
        ) : (
          <div className="overflow-x-auto pb-4">
            <KanbanBoard
              applications={applicationsQuery.data ?? []}
              isUpdating={reorderApplications.isPending}
              onReorder={handleReorder}
            />
          </div>
        )}

        {reorderApplications.isError ? (
          <p role="alert" className="mt-4 text-sm text-red-700">
            The card could not be moved. Please try again.
          </p>
        ) : null}
      </div>
    </main>
  );
}
