import { api } from "../../lib/api";
import type {
  Survey,
  CreateSurveyRequest,
  UpdateSurveyRequest,
  BackendSurvey,
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
    createSurvey: builder.mutation<Survey, CreateSurveyRequest>({
      query: (body) => ({
        url: "/surveys",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Survey"],
    }),
    updateSurvey: builder.mutation<Survey, UpdateSurveyRequest>({
      query: ({ id, ...patch }) => ({
        url: `/surveys/${id}`,
        method: "PATCH",
        body: patch,
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
  }),
});

export const {
  useGetSurveysQuery,
  useGetSurveyByIdQuery,
  useCreateSurveyMutation,
  useUpdateSurveyMutation,
  useDeleteSurveyMutation,
} = surveysApi;
