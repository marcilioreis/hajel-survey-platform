import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const baseUrl = `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api`;

const baseQuery = fetchBaseQuery({
  baseUrl: baseUrl, // já ajustado
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("auth-token");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

export const geographyApi = createApi({
  reducerPath: "geographyApi",
  baseQuery: baseQuery,
  endpoints: (builder) => ({
    getStates: builder.query<string[], void>({
      query: () => "/geography/states",
    }),
    getMunicipalities: builder.query<string[], string>({
      query: (uf) => `/geography/municipalities/${uf}`,
    }),
    getNeighborhoods: builder.query<
      { id: number; name: string; type?: string }[],
      { city: string; uf: string }
    >({
      query: ({ city, uf }) => `/geography/neighborhoods/${city}?uf=${uf}`,
    }),
    getCep: builder.query<unknown, string>({
      query: (cep) => `/geography/cep/${cep}`,
    }),
  }),
});

export const {
  useGetStatesQuery,
  useGetMunicipalitiesQuery,
  useGetNeighborhoodsQuery,
  useGetCepQuery,
} = geographyApi;
