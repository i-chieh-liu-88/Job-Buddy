import { createFileRoute } from "@tanstack/react-router";
import { QuestionBankPage } from "../pages/QuestionBankPage/QuestionBankPage";

export const Route = createFileRoute("/questions")({ component: QuestionBankPage });
