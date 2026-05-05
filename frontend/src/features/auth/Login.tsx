import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { useLoginMutation } from "./authApi";
import { useAppDispatch } from "../../app/hooks";
import { setCredentials } from "./authSlice";
import logo from "../../assets/logo.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      const result = await login({ email, password }).unwrap();
      dispatch(setCredentials({ user: result.user }));
      navigate("/surveys");
    } catch (err) {
      const error = err as { data?: string; message?: string };
      setErrorMsg(error.data || error.message || "Falha no login.");
      toast.error(error.data || error.message || "Falha na autenticação.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-center mb-6">
          <img src={logo} alt="Retrato" className="h-10" />
        </div>
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Entrar
        </h1>
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
          data-testid="login-form"
        >
          <div>
            <label
              htmlFor="login-email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id="login-email"
              name="email"
              data-testid="login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label
              htmlFor="login-password"
              className="block text-sm font-medium text-gray-700"
            >
              Senha
            </label>
            <input
              id="login-password"
              name="password"
              data-testid="login-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base"
              placeholder="********"
            />
          </div>
          {errorMsg && (
            <div
              className="text-red-600 text-sm bg-red-50 p-2 rounded"
              data-testid="login-error"
            >
              {errorMsg}
            </div>
          )}
          <button
            type="submit"
            data-testid="login-submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Entrando..." : "Entrar"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Não tem uma conta?{" "}
          <Link
            to="/register"
            className="font-medium text-blue-600 hover:text-blue-500"
            data-testid="login-register-link"
          >
            Cadastre-se
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-gray-600">
          <Link
            to="/forgot-password"
            className="font-medium text-blue-600 hover:text-blue-500"
            data-testid="login-forgot-password-link"
          >
            Esqueci minha senha
          </Link>
        </p>
      </div>
    </div>
  );
}
