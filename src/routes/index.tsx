import { createFileRoute } from "@tanstack/react-router";
import { KanbanBoardPage } from "../pages/KanbanBoardPage/KanbanBoardPage";

export const Route = createFileRoute("/")({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) => ({
    applicationId:
      typeof search.applicationId === "string" ? search.applicationId : undefined,
  }),
});

function RouteComponent() {
  return <KanbanBoardPage />;
}
