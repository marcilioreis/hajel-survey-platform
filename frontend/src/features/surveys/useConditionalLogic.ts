import { useMemo } from "react";
import type {
  Question,
  ConditionalLogic,
  AnswersMap,
} from "../surveys/surveys.types";

function evaluateCondition(
  condition: ConditionalLogic["conditions"][0],
  answers: AnswersMap,
): boolean {
  const answer = answers[condition.questionId];
  if (answer === undefined || answer === null) return false;

  // Normaliza para array para facilitar a comparação
  const answerArray = Array.isArray(answer) ? answer : [answer];
  const valueArray = Array.isArray(condition.value)
    ? condition.value
    : [condition.value];

  switch (condition.operator) {
    case "equals":
      return valueArray.some((v) => answerArray.includes(v));
    case "not_equals":
      return !valueArray.some((v) => answerArray.includes(v));
    case "contains":
      return answerArray.some((a) => valueArray.some((v) => a.includes(v)));
    case "not_contains":
      return !answerArray.some((a) => valueArray.some((v) => a.includes(v)));
    default:
      return false;
  }
}

export function useConditionalLogic(
  questions: Question[],
  answers: AnswersMap,
): Question[] {
  return useMemo(() => {
    return questions.filter((question) => {
      const logic = question.conditional_logic;
      if (!logic) return true;

      const conditionsMet = logic.conditions.every((cond) =>
        evaluateCondition(cond, answers),
      );

      if (logic.action === "skip" && conditionsMet) return false;
      if (logic.action === "show" && !conditionsMet) return false;
      return true;
    });
  }, [questions, answers]);
}
