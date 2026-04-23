import { api } from "../../lib/api";
import type {
  Survey,
  BackendSurvey,
  SurveyPayload,
  Location,
  CreateQuestionPayload,
  BackendQuestion,
  UpdateQuestionPayload,
  SubmitResponsePayload,
} from "./surveys.types";

export const surveysApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getSurveys: builder.query<Survey[], void>({
      query: () => "/surveys",
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Survey" as const, id })),
              "Survey",
            ]
          : ["Survey"],
    }),
    getSurveyById: builder.query<BackendSurvey, string>({
      query: (id) => `/surveys/${id}`,
      providesTags: (result, error, id) => [{ type: "Survey", id }],
    }),
    createSurvey: builder.mutation<BackendSurvey, SurveyPayload>({
      query: (body) => ({
        url: "/surveys",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Survey"],
    }),
    updateSurvey: builder.mutation<
      BackendSurvey,
      { id: string | number; body: Partial<SurveyPayload> }
    >({
      query: ({ id, body }) => ({
        url: `/surveys/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Survey", id }],
    }),
    deleteSurvey: builder.mutation<void, string>({
      query: (id) => ({
        url: `/surveys/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Survey"],
    }),
    addQuestion: builder.mutation<
      BackendQuestion,
      { surveyId: string | number; body: CreateQuestionPayload }
    >({
      query: ({ surveyId, body }) => ({
        url: `/surveys/${surveyId}/questions`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { surveyId }) => [
        { type: "Survey", id: surveyId },
      ],
    }),
    updateQuestion: builder.mutation<
      BackendQuestion,
      {
        surveyId: string | number;
        questionId: number;
        body: UpdateQuestionPayload;
      }
    >({
      query: ({ surveyId, questionId, body }) => ({
        url: `/surveys/${surveyId}/questions/${questionId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { surveyId }) => [
        { type: "Survey", id: surveyId },
      ],
    }),
    deleteQuestion: builder.mutation<
      void,
      { surveyId: string | number; questionId: number }
    >({
      query: ({ surveyId, questionId }) => ({
        url: `/surveys/${surveyId}/questions/${questionId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { surveyId }) => [
        { type: "Survey", id: surveyId },
      ],
    }),
    submitResponses: builder.mutation<
      { success: boolean },
      SubmitResponsePayload
    >({
      query: (body) => ({
        url: `/surveys/${body.surveyId}/responses`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { surveyId }) => [
        { type: "Survey", id: surveyId },
      ],
    }),
    // Listar todos os locais (para dropdown)
    getLocations: builder.query<Location[], void>({
      query: () => "/locations",
    }),
    // Locais de uma pesquisa específica
    getSurveyLocations: builder.query<Location[], string>({
      query: (id) => `/surveys/${id}/locations`,
    }),
    // Atualizar locais de uma pesquisa (associação)
    updateSurveyLocations: builder.mutation<
      void,
      { surveyId: number; locationIds: number[] }
    >({
      query: ({ surveyId, locationIds }) => ({
        url: `/surveys/${surveyId}/locations`,
        method: "PUT",
        body: { locationIds },
      }),
      invalidatesTags: (result, error, { surveyId }) => [
        { type: "Survey", id: surveyId },
      ],
    }),
  }),
});

export const {
  useGetSurveysQuery,
  useGetLocationsQuery,
  useGetSurveyLocationsQuery,
  useGetSurveyByIdQuery,
  useDeleteSurveyMutation,
  useCreateSurveyMutation,
  useUpdateSurveyMutation,
  useAddQuestionMutation,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
  useSubmitResponsesMutation,
} = surveysApi;
