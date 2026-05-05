import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { useRegisterMutation } from "./authApi";
import { useAppDispatch } from "../../app/hooks";
import { setCredentials } from "./authSlice";
import logo from "../../assets/logo.png";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [register, { isLoading }] = useRegisterMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (password !== confirmPassword) {
      setErrorMsg("As senhas não coincidem.");
      return;
    }
    try {
      const result = await register({ email, password, name }).unwrap();
      dispatch(setCredentials({ user: result.user }));
      navigate("/surveys");
    } catch (err) {
      const error = err as { data?: string; message?: string };
      setErrorMsg(error.data || error.message || "Falha no cadastro.");
      toast.error(error.data || error.message || "Falha no cadastro.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-center mb-6">
          <img src={logo} alt="Retrato" className="h-10" />
        </div>
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Cadastrar
        </h1>
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
          data-testid="register-form"
        >
          <div>
            <label
              htmlFor="register-name"
              className="block text-sm font-medium text-gray-700"
            >
              Nome completo
            </label>
            <input
              id="register-name"
              name="name"
              data-testid="register-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base"
              placeholder="Seu nome"
            />
          </div>
          <div>
            <label
              htmlFor="register-email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id="register-email"
              name="email"
              data-testid="register-email"
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
              htmlFor="register-password"
              className="block text-sm font-medium text-gray-700"
            >
              Senha
            </label>
            <input
              id="register-password"
              name="password"
              data-testid="register-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base"
              placeholder="********"
            />
          </div>
          <div>
            <label
              htmlFor="register-confirm-password"
              className="block text-sm font-medium text-gray-700"
            >
              Confirmar senha
            </label>
            <input
              id="register-confirm-password"
              name="confirmPassword"
              data-testid="register-confirm-password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base"
              placeholder="********"
            />
          </div>
          {errorMsg && (
            <div
              className="text-red-600 text-sm bg-red-50 p-2 rounded"
              data-testid="register-error"
            >
              {errorMsg}
            </div>
          )}
          <button
            type="submit"
            data-testid="register-submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Cadastrando..." : "Cadastrar"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Já tem uma conta?{" "}
          <Link
            to="/login"
            className="font-medium text-blue-600 hover:text-blue-500"
            data-testid="register-login-link"
          >
            Faça login
          </Link>
        </p>
      </div>
    </div>
  );
}
