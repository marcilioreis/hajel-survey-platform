// src/shared/db/schema/views.types.ts
export type SurveyEnriched = {
  id: number;
  title: string;
  description: string | null;
  createdBy: string;
  public: boolean;
  slug: string | null;
  startDate: Date | null;
  endDate: Date;
  active: boolean;
  customStyle: unknown;
  createdAt: Date;
  questions: Array<{
    id: number;
    text: string;
    type: string;
    required: boolean;
    order: number;
    options: unknown;
    conditionalLogic: unknown;
  }>;
  locations: Array<{
    id: number;
    name: string;
    order: number;
  }>;
  responsesCount: number;
  status: 'ativa' | 'rascunho' | 'expirada' | 'inativa';
};
