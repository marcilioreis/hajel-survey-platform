import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  PublicSurvey,
  StartSessionResponse,
  AnswerPayload,
  ProgressResponse,
  CompleteSessionPayload,
  CompleteSessionResponse,
} from "./publicSurvey.types";

export const publicSurveyApi = createApi({
  reducerPath: "publicSurveyApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_PUBLIC_URL || "http://localhost:3000",
    credentials: "omit", // endpoints públicos não precisam de cookies de autenticação
  }),
  endpoints: (builder) => ({
    getPublicSurvey: builder.query<PublicSurvey, string>({
      query: (slug) => `/s/${slug}`,
    }),
    startSession: builder.mutation<StartSessionResponse, string>({
      query: (slug) => ({
        url: `/s/${slug}/start`,
        method: "POST",
      }),
    }),
    submitAnswer: builder.mutation<
      void,
      { token: string; body: AnswerPayload }
    >({
      query: ({ token, body }) => ({
        url: `/s/${token}/answers`,
        method: "POST",
        body,
      }),
    }),
    submitAnswersBatch: builder.mutation<
      void,
      { token: string; body: AnswerPayload[] }
    >({
      query: ({ token, body }) => ({
        url: `/s/${token}/answers/batch`,
        method: "POST",
        body,
      }),
    }),
    getProgress: builder.query<ProgressResponse, string>({
      query: (token) => `/s/${token}/progress`,
    }),
    completeSession: builder.mutation<
      CompleteSessionResponse,
      { token: string; body: CompleteSessionPayload }
    >({
      query: ({ token, body }) => ({
        url: `/s/${token}/complete`,
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useGetPublicSurveyQuery,
  useStartSessionMutation,
  useSubmitAnswerMutation,
  useSubmitAnswersBatchMutation,
  useGetProgressQuery,
  useCompleteSessionMutation,
} = publicSurveyApi;
