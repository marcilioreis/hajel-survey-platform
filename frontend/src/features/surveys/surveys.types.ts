// ============ Tipos de Perguntas e Opções ============
export interface QuestionOption {
  id?: string;
  text: string;
  order?: number;
}

export interface ConditionalLogic {
  action: "skip" | "show";
  conditions: {
    questionId: number;
    operator: "equals" | "not_equals" | "contains" | "not_contains";
    value: string | string[];
  }[];
}

export interface Question {
  id?: number;
  text: string;
  type: "texto_longo" | "unica_escolha" | "multipla_escolha";
  required: boolean;
  options: QuestionOption[];
  order?: number;
  conditional_logic?: ConditionalLogic | null;
}

export interface BackendQuestion {
  id: number;
  text: string;
  type: string;
  required: boolean;
  options: QuestionOption[];
  order: number;
  conditional_logic?: ConditionalLogic | null;
}

// NOVO: tipo unificado para perguntas brutas vindas do backend
export interface RawQuestion {
  id: number;
  text: string;
  type: string; // string original do backend
  required: boolean;
  order: number;
  options: (string | QuestionOption)[]; // aceita ambos os formatos
  conditional_logic?: ConditionalLogic | null;
  conditionalLogic?: ConditionalLogic | null; // camelCase vindo do backend público
}

// ============ Tipos de Pesquisas ============
export interface BackendSurvey {
  id: number;
  title: string;
  description?: string;
  created_by: string;
  public: boolean;
  slug: string;
  start_date: string;
  end_date: string;
  active: boolean;
  custom_style: unknown | null;
  created_at: string;
  questions: BackendQuestion[];
  locations?: Location[];
  responses_count: number;
  status: string;
}

export interface Survey {
  id: number;
  title: string;
  description?: string;
  created_by: string;
  public: boolean;
  slug: string;
  startDate: string;
  endDate: string;
  active: boolean;
  custom_style: unknown | null;
  createdAt: string;
  questions: Question[];
  locations?: Location[];
  responses_count: number;
  status: string;
}

// ============ Payloads ============
export interface CreateQuestionPayload {
  text: string;
  type: "unica_escolha" | "multipla_escolha" | "texto_longo";
  required: boolean;
  options: string[];
  order?: number;
  conditional_logic?: ConditionalLogic | null;
}

export interface UpdateQuestionPayload extends Partial<CreateQuestionPayload> {
  _dummy?: never;
}

export interface SurveyPayload {
  title: string;
  description?: string | null;
  public: boolean;
  active: boolean;
  slug?: string;
  startDate?: string;
  endDate: string;
  customStyle?: Record<string, unknown> | null;
  locations?: { id: number; order: number }[];
}

// ============ Respostas ============
export type AnswersMap = Record<number, string | string[]>;

export interface AnswerPayload {
  questionId: number;
  value: string | string[];
}

export interface SubmitResponsePayload {
  surveyId: number;
  answers: AnswerPayload[];
  respondentIdentifier?: string;
}

export interface DemographicData {
  ageRange: string;
  gender: string;
  incomeRange: string;
  education: string;
  occupation: string;
  locationId: string;
}

// ============ Localizações ============
export interface Location {
  id: number;
  name: string;
  state?: string;
  city?: string;
  neighborhood?: string;
  cep?: string;
  address?: string;
  ibgeCode?: string;
  notes?: string;
}

export interface LocationPayload {
  name: string;
  state: string;
  city: string;
  neighborhood?: string;
  cep?: string;
  address?: string;
  ibgeCode?: string;
  notes?: string;
}

// ============ Relatórios ============
export interface QuestionResult {
  questionId: number;
  questionText: string;
  type: string;
  totalResponses: number;
  data: {
    option: string;
    count: number;
    percentage: number;
    response?: string;
  }[];
}

export type SurveyResults = QuestionResult[];

export interface OpenResponse {
  questionId: number;
  questionText: string;
  type: string;
  responses: string[];
}

export interface ExportRequestResponse {
  exportId: string;
}

export interface ExportStatus {
  id: number;
  status: "processando" | "concluido" | "falha";
  downloadLink?: string;
}
