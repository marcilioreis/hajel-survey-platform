import type {
  CreateQuestionPayload,
  Question,
} from "../features/surveys/surveys.types";

// Mapeamento de tipos do backend para o frontend
export const mapBackendTypeToFrontend = (
  backendType: string,
): Question["type"] => {
  const mapping: Record<string, Question["type"]> = {
    unica_escolha: "unica_escolha",
    multipla_escolha: "multipla_escolha",
    texto_longo: "texto_longo",
  };
  return mapping[backendType] || "texto_longo";
};

// Mapeamento de tipos do frontend para o backend
export const mapFrontendTypeToBackend = (
  frontendType: Question["type"],
): CreateQuestionPayload["type"] => {
  const mapping: Record<Question["type"], CreateQuestionPayload["type"]> = {
    unica_escolha: "unica_escolha",
    multipla_escolha: "multipla_escolha",
    texto_longo: "texto_longo",
  };
  return mapping[frontendType];
};
