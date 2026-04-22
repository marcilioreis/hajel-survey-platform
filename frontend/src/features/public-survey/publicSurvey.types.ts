export interface PublicSurvey {
  id: number;
  title: string;
  description?: string;
  questions: PublicQuestion[];
  locations: Location[];
}

export interface PublicQuestion {
  id: number;
  text: string;
  type: "unica_escolha" | "multipla_escolha" | "texto_longo";
  required: boolean;
  options: string[]; // já vem como array de strings
  order: number;
}

export interface Location {
  id: number;
  name: string;
  // outros campos conforme necessário
}

export interface StartSessionResponse {
  token: string;
  expiresIn: number; // segundos
}

export interface AnswerPayload {
  questionId: number;
  value: string | string[];
}

export interface ProgressResponse {
  status: "em_andamento" | "concluida" | "expirada";
  answers: AnswerPayload[];
  lastActivity: string;
}

export interface CompleteSessionPayload {
  ageRange: string;
  gender: string;
  incomeRange: string;
  education: string;
  occupation: string;
  locationId: number;
}

export interface CompleteSessionResponse {
  success: boolean;
  respondentId?: number;
}
