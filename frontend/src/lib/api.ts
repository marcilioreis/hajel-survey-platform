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

export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQuery,
  endpoints: () => ({}),
  tagTypes: ["Survey", "Response", "Report"],
});
