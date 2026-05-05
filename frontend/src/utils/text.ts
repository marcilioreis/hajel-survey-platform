import type { QuestionOption } from "../features/surveys/surveys.types";

export const getOptionText = (opt: string | QuestionOption): string =>
  typeof opt === "string" ? opt : opt.text;
