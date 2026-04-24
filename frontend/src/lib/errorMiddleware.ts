import { isRejectedWithValue } from "@reduxjs/toolkit";
import type { Middleware } from "@reduxjs/toolkit";
import { toast } from "sonner";

interface PayloadData {
  error: string;
}

export const rtkQueryErrorLogger: Middleware = () => (next) => (action) => {
  if (isRejectedWithValue(action)) {
    const payload = action.payload as { status?: number; data?: PayloadData };
    console.log("payload :>> ", payload);
    if (payload.status === 401) {
      toast.error("Sessão expirada. Faça login novamente.");
    } else {
      toast.error(payload.data?.error || "Ocorreu um erro inesperado.");
    }
  }
  return next(action);
};
