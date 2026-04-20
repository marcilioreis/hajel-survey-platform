import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl,
    // baseUrl: "/api",
    credentials: "include", // cookies enviados automaticamente
  }),
  endpoints: () => ({}),
  tagTypes: ["Survey", "Response", "Report"],
});
