export interface QuestionOption {
  id?: string; // opcional na criação
  text: string;
  order?: number;
}

export interface Question {
  id: number;
  text: string;
  type: "unica_escolha" | "multipla_escolha" | "texto"; // ajuste conforme backend: 'unica_escolha' etc.
  required: boolean;
  options: QuestionOption[]; // ← aceita ambos
  order?: number;
  conditional_logic?: unknown;
}

export interface BackendQuestion {
  id: number;
  text: string;
  type: string; // 'unica_escolha', 'multipla_escolha', 'text'
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
  start_date: string | null;
  end_date: string | null;
  active: boolean;
  custom_style: unknown | null;
  created_at: string;
  questions: BackendQuestion[];
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
  start_date: string | null;
  end_date: string | null;
  active: boolean;
  custom_style: unknown | null;
  created_at: string;
  questions: Question[];
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
