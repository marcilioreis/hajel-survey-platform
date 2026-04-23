export interface QuestionOption {
  id?: string; // opcional na criação
  text: string;
  order?: number;
}

// Tipo Question do frontend (usado no estado do formulário)
export interface Question {
  id?: number; // opcional para novas perguntas
  text: string;
  type: "texto_longo" | "unica_escolha" | "multipla_escolha"; // frontend usa 'texto_longo'
  required: boolean;
  options: QuestionOption[];
  order?: number;
}

export interface BackendQuestion {
  id: number;
  text: string;
  type: string; // 'unica_escolha', 'multipla_escolha', 'texto_longo'
  required: boolean;
  order: number;
  options: string[]; // sempre strings no backend
  conditional_logic?: unknown;
}

export interface BackendSurvey {
  id: number; // ou string, dependendo
  title: string;
  description?: string;
  created_by: string;
  public: boolean;
  slug: string;
  start_date: string;
  end_date: string | null;
  active: boolean;
  custom_style: unknown | null;
  created_at: string;
  questions: BackendQuestion[];
  locations?: Array<{ id: number; name: string }>;
  responses_count: string | number;
  status: string;
}

export interface Survey {
  id: number; // ou string, dependendo
  title: string;
  description?: string;
  created_by: string;
  public: boolean;
  slug: string;
  startDate: string;
  endDate: string | null;
  active: boolean;
  custom_style: unknown | null;
  createdAt: string;
  questions: Question[];
  locations?: Array<{ id: number; name: string }>;
  responses_count: string | number;
  status: string;
}

// Tipo para uma pergunta no payload de criação (como o backend espera)
export interface CreateQuestionRequest {
  text: string;
  type: string; // ou o union type do backend: 'unica_escolha' | 'multipla_escolha' | 'text'
  required: boolean;
  options: string[]; // ← array de strings
  order?: number;
}

export interface CreateSurveyRequest {
  title: string;
  description?: string;
  questions: CreateQuestionRequest[];
}

export interface UpdateSurveyRequest {
  id: string | number; // dependendo do backend
  title?: string;
  description?: string;
  questions?: CreateQuestionRequest[];
}

// Payload para criação/atualização da pesquisa
export interface SurveyPayload {
  title: string;
  description?: string | null;
  public: boolean;
  active: boolean;
  slug?: string;
  endDate: string; // ISO string
  customStyle?: Record<string, unknown> | null;
}

// Payload para criação de pergunta (única)
export interface CreateQuestionPayload {
  text: string;
  type: "unica_escolha" | "multipla_escolha" | "texto_longo"; // backend espera 'texto'
  required: boolean;
  options: string[];
  order?: number;
}

// Payload para atualização de pergunta
export interface UpdateQuestionPayload extends Partial<CreateQuestionPayload> {
  _dummy?: never; // apenas para evitar o aviso
}

// Resposta de uma única pergunta
export interface Answer {
  questionId: number;
  value: string | string[]; // string para texto/única escolha, array para múltipla escolha
}

export interface AnswerPayload {
  questionId: number;
  value: string | string[];
}

// Payload para envio das respostas
export interface SubmitResponsePayload {
  surveyId: number;
  answers: Answer[];
  respondentIdentifier?: string; // opcional: email, código etc.
}

export interface DemographicData {
  ageRange: string;
  gender: string;
  incomeRange: string;
  education: string;
  occupation: string;
  locationId: string;
}
