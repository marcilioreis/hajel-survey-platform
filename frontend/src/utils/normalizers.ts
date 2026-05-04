import type {
  RawQuestion,
  Question,
  QuestionOption,
} from "../features/surveys/surveys.types";
import { mapBackendTypeToFrontend } from "./mapping";

export function normalizeQuestions(rawQuestions: RawQuestion[]): Question[] {
  return rawQuestions.map((q) => ({
    id: q.id,
    text: q.text,
    type: mapBackendTypeToFrontend(q.type),
    required: q.required,
    options: q.options.map(
      (opt): QuestionOption => (typeof opt === "string" ? { text: opt } : opt),
    ),
    order: q.order,
    conditional_logic: q.conditional_logic ?? q.conditionalLogic ?? null,
  }));
}
