import { KanbanBoard } from "../../components/organisms/KanbanBoard/KanbanBoard";
import {
  useJobApplications,
  useReorderJobApplications,
} from "../../hooks/useJobApplications";
import type { ReorderResult } from "../../components/organisms/KanbanBoard/reorderApplications";

export function KanbanBoardPage() {
  const applicationsQuery = useJobApplications();
  const reorderApplications = useReorderJobApplications();

  function handleReorder(result: ReorderResult) {
    reorderApplications.mutate(result);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[96rem]">
        <header className="mb-8">
          <p className="text-sm font-medium uppercase tracking-wider text-blue-600">
            Job Buddy
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Applications
          </h1>
          <p className="mt-2 text-slate-600">
            Track every opportunity from saved to final decision.
          </p>
        </header>

        {applicationsQuery.isPending ? (
          <p role="status" className="text-slate-600">
            Loading applications…
          </p>
        ) : applicationsQuery.isError ? (
          <p role="alert" className="text-red-700">
            Could not load applications. Please try again.
          </p>
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
