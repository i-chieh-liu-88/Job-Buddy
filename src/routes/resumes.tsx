import { createFileRoute } from "@tanstack/react-router";
import { ResumeLibraryPage } from "../pages/ResumeLibraryPage/ResumeLibraryPage";

export const Route = createFileRoute("/resumes")({
  component: ResumeLibraryPage,
});
