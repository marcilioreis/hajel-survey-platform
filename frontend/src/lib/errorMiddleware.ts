import { isRejectedWithValue } from "@reduxjs/toolkit";
import type { Middleware } from "@reduxjs/toolkit";
import { toast } from "sonner";

export const rtkQueryErrorLogger: Middleware = () => (next) => (action) => {
  if (isRejectedWithValue(action)) {
    const payload = action.payload as { status?: number; data?: string };
    if (payload.status === 401) {
      toast.error("Sessão expirada. Faça login novamente.");
    } else {
      toast.error(payload.data || "Ocorreu um erro inesperado.");
    }
  }
  return next(action);
};
