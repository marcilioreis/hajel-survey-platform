import { configureStore, isPlain } from "@reduxjs/toolkit";
import { api } from "../lib/api";
import { rtkQueryErrorLogger } from "../lib/errorMiddleware";
import authReducer from "../features/auth/authSlice";
import surveysReducer from "../features/surveys/surveysSlice";
import { publicSurveyApi } from "../features/public-survey/publicSurveyApi";

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    [publicSurveyApi.reducerPath]: publicSurveyApi.reducer,
    auth: authReducer,
    surveys: surveysReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Permite objetos Date no estado
        isSerializable: (value: unknown) => {
          if (value instanceof Date) return true;
          return isPlain(value);
        },
      },
    })
      .concat(api.middleware, rtkQueryErrorLogger)
      .concat(publicSurveyApi.middleware),
  //
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
