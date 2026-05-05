import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { resetPassword } from "../../lib/auth";

export default function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("As senhas não coincidem.");
      return;
    }
    try {
      await resetPassword(token!, password);
      toast.success("Senha redefinida com sucesso!");
      navigate("/login");
    } catch {
      toast.error("Erro ao redefinir a senha. O link pode ser inválido.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4"
        data-testid="reset-password-form"
      >
        <h1 className="text-xl font-bold">Redefinir senha</h1>
        <div>
          <label
            htmlFor="reset-password-new"
            className="block text-sm font-medium text-gray-700"
          >
            Nova senha
          </label>
          <input
            id="reset-password-new"
            name="password"
            data-testid="reset-password-new"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nova senha"
            required
            className="w-full p-3 border rounded-lg"
          />
        </div>
        <div>
          <label
            htmlFor="reset-password-confirm"
            className="block text-sm font-medium text-gray-700"
          >
            Confirme a nova senha
          </label>
          <input
            id="reset-password-confirm"
            name="confirmPassword"
            data-testid="reset-password-confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirme a nova senha"
            required
            className="w-full p-3 border rounded-lg"
          />
        </div>
        <button
          type="submit"
          data-testid="reset-password-submit"
          className="w-full py-3 bg-blue-600 text-white rounded-lg"
        >
          Redefinir
        </button>
      </form>
    </div>
  );
}
