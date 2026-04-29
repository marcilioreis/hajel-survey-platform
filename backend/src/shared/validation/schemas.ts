// src/shared/validation/schemas.ts
import { z } from 'zod';

// ================== SURVEYS ==================
export const createSurveySchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  slug: z.string().optional(),
  public: z.boolean().optional().default(false),
  active: z.boolean().optional().default(false),
  endDate: z.string().datetime({ message: 'Data inválida' }), // ISO 8601
  startDate: z.string().datetime().optional(), // se permitir customização
  customStyle: z.any().optional(),
});

export const updateSurveySchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  public: z.boolean().optional(),
  active: z.boolean().optional(),
  endDate: z.string().datetime().optional(),
  locations: z
    .array(
      z.object({
        name: z.string().min(1),
        order: z.number().int().min(1),
      })
    )
    .optional(),
  customStyle: z.any().optional(),
});

// ================== QUESTIONS ==================
export const createQuestionSchema = z.object({
  text: z.string().min(1, 'Texto é obrigatório'),
  type: z.enum(['unica_escolha', 'multipla_escolha', 'texto_curto', 'texto_longo']),
  required: z.boolean().optional().default(true),
  order: z.number().int().min(1),
  options: z.array(z.string()).optional(),
  conditionalLogic: z.any().optional(),
});

export const updateQuestionSchema = z
  .object({
    text: z.string().min(1).optional(),
    type: z.enum(['unica_escolha', 'multipla_escolha', 'texto_curto', 'texto_longo']).optional(),
    required: z.boolean().optional(),
    order: z.number().int().min(1).optional(),
    options: z.array(z.string()).optional(),
    conditionalLogic: z.any().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Nenhum campo para atualizar',
  });

export const batchCreateQuestionsSchema = z.array(createQuestionSchema).nonempty('Array vazio');

// ================== LOCATIONS ==================
export const createLocationSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  order: z.number().int().optional(),
});

export const updateLocationSchema = z
  .object({
    name: z.string().min(1).optional(),
    order: z.number().int().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Nenhum campo para atualizar',
  });

// ================== RESPONSES ==================
export const answerPayloadSchema = z.object({
  questionId: z.number().int().positive(),
  value: z.unknown(), // validação específica será feita pelo serviço
});

export const submitSingleAnswerSchema = z.object({
  questionId: z.number().int().positive(),
  value: z.unknown(),
});

export const batchAnswersSchema = z.array(answerPayloadSchema).nonempty('Array vazio');

export const completeSessionSchema = z.object({
  ageRange: z.string().min(1, 'Faixa etária obrigatória'),
  gender: z.string().min(1, 'Gênero obrigatório'),
  incomeRange: z.string().min(1, 'Faixa de renda obrigatória'),
  education: z.string().min(1, 'Escolaridade obrigatória'),
  occupation: z.string().min(1, 'Ocupação obrigatória'),
  locationId: z.number().int().positive('ID de local inválido'),
});

export const authenticatedResponsesSchema = z.object({
  answers: z.array(answerPayloadSchema).nonempty('Answers array cannot be empty'),
  respondent: z
    .object({
      ageRange: z.string().optional(),
      gender: z.string().optional(),
      incomeRange: z.string().optional(),
      education: z.string().optional(),
      occupation: z.string().optional(),
      locationId: z.number().int().positive().optional(),
    })
    .optional(),
});

// ================== EXPORTS ==================
export const exportRequestSchema = z.object({
  format: z.enum(['csv', 'xlsx', 'json']).optional().default('csv'),
  filters: z
    .object({
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
      locationIds: z.array(z.number().int().positive()).optional(),
    })
    .optional(),
});
