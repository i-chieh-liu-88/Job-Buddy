import { createFileRoute } from "@tanstack/react-router";
import { KanbanBoardPage } from "../pages/KanbanBoardPage/KanbanBoardPage";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <KanbanBoardPage />;
}
