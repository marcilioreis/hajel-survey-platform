import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { requestPasswordReset } from "../../lib/auth";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await requestPasswordReset(email);
      setSubmitted(true);
    } catch {
      toast.error("Erro ao enviar o e-mail. Verifique o endereço.");
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-bold mb-2">Verifique seu e‑mail</h1>
          <p className="text-gray-600">
            Enviamos um link de redefinição para {email}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-xl font-bold">Esqueci minha senha</h1>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          required
          className="w-full p-3 border rounded-lg"
        />
        <button
          type="submit"
          className="w-full py-3 bg-blue-600 text-white rounded-lg"
        >
          Enviar link de redefinição
        </button>
        <p className="text-center text-sm">
          <Link to="/login" className="text-blue-600">
            Voltar ao login
          </Link>
        </p>
      </form>
    </div>
  );
}
