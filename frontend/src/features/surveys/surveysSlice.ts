import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface SurveysState {
  searchTerm: string;
  statusFilter: "all" | "rascunho" | "ativa" | "expirada";
  sortBy: "createdAt" | "title" | "responsesCount";
  sortOrder: "asc" | "desc";
}

const initialState: SurveysState = {
  searchTerm: "",
  statusFilter: "all",
  sortBy: "createdAt",
  sortOrder: "desc",
};

const surveysSlice = createSlice({
  name: "surveys",
  initialState,
  reducers: {
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
    },
    setStatusFilter: (
      state,
      action: PayloadAction<SurveysState["statusFilter"]>,
    ) => {
      state.statusFilter = action.payload;
    },
    setSortBy: (state, action: PayloadAction<SurveysState["sortBy"]>) => {
      state.sortBy = action.payload;
    },
    toggleSortOrder: (state) => {
      state.sortOrder = state.sortOrder === "asc" ? "desc" : "asc";
    },
  },
});

export const { setSearchTerm, setStatusFilter, setSortBy, toggleSortOrder } =
  surveysSlice.actions;
export default surveysSlice.reducer;
