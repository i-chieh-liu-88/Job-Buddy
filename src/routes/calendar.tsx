import { createFileRoute } from "@tanstack/react-router";
import { InterviewCalendarPage } from "../pages/InterviewCalendarPage/InterviewCalendarPage";

export const Route = createFileRoute("/calendar")({
  component: InterviewCalendarPage,
});
