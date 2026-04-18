import { createAuthClient } from "better-auth/client";

// A URL da API será definida via variável de ambiente
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
  // Opções adicionais conforme documentação do Better Auth
});

// Funções auxiliares para uso nos componentes
export const login = async (email: string, password: string) => {
  const response = await authClient.signIn.email({ email, password });
  return response;
};

export const register = async (
  email: string,
  password: string,
  name: string,
) => {
  const response = await authClient.signUp.email({ email, password, name });
  return response;
};

export const logout = async () => {
  await authClient.signOut();
};

export const getSession = async () => {
  const session = await authClient.getSession();
  return session;
};
