import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  useCompleteSessionMutation,
  useGetPublicSurveyQuery,
} from "./publicSurveyApi";
import type { CompleteSessionPayload } from "./publicSurvey.types";

export default function DemographicForm() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const token = slug ? localStorage.getItem(`survey-token-${slug}`) : null;
  const { data: survey } = useGetPublicSurveyQuery(slug!, { skip: !slug });
  const [completeSession, { isLoading }] = useCompleteSessionMutation();

  const [form, setForm] = useState({
    ageRange: "",
    gender: "",
    incomeRange: "",
    education: "",
    occupation: "",
    locationId: "",
  });

  if (!token || !survey) {
    navigate(`/s/${slug}`);
    return null;
  }

  console.log("survey :>> ", survey);

  const locations = survey.locations || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.values(form).some((v) => !v)) {
      toast.error("Preencha todos os campos.");
      return;
    }

    const payload: CompleteSessionPayload = {
      ...form,
      locationId: Number(form.locationId),
    };

    try {
      await completeSession({ token, body: payload }).unwrap();
      localStorage.removeItem(`survey-token-${slug}`);
      toast.success("Pesquisa concluída! Obrigado por participar.");
      navigate(`/s/${slug}/thank-you`);
    } catch {
      toast.error("Erro ao finalizar. Tente novamente.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-sm space-y-4"
      >
        <h2 className="text-xl font-bold mb-4">
          Quase lá! Preencha seus dados
        </h2>

        <select
          value={form.ageRange}
          onChange={(e) => setForm({ ...form, ageRange: e.target.value })}
          required
          className="w-full p-3 border rounded-lg"
        >
          <option value="">Faixa etária</option>
          <option value="16-24">16-24 anos</option>
          <option value="25-34">25-34 anos</option>
          <option value="35-44">35-44 anos</option>
          <option value="45-54">45-54 anos</option>
          <option value="55-65">55-65 anos</option>
          <option value="65+">65+ anos</option>
        </select>

        <select
          value={form.gender}
          onChange={(e) => setForm({ ...form, gender: e.target.value })}
          required
          className="w-full p-3 border rounded-lg"
        >
          <option value="">Gênero</option>
          <option value="M">Masculino</option>
          <option value="F">Feminino</option>
          <option value="NB">Não-binário</option>
          <option value="O">Outro</option>
          <option value="PNR">Prefiro não responder</option>
        </select>

        <select
          value={form.incomeRange}
          onChange={(e) => setForm({ ...form, incomeRange: e.target.value })}
          required
          className="w-full p-3 border rounded-lg"
        >
          <option value="">Renda familiar</option>
          <option value="<1 SM">Menos de 1 salário mínimo</option>
          <option value="1-2 SM">1 a 2 salários mínimos</option>
          <option value="2-3 SM">2 a 3 salários mínimos</option>
          <option value="3-4 SM">3 a 4 salários mínimos</option>
          <option value=">4 SM">Mais de 4 salários mínimos</option>
        </select>

        <input
          type="text"
          placeholder="Escolaridade"
          value={form.education}
          onChange={(e) => setForm({ ...form, education: e.target.value })}
          required
          className="w-full p-3 border rounded-lg"
        />

        <input
          type="text"
          placeholder="Ocupação"
          value={form.occupation}
          onChange={(e) => setForm({ ...form, occupation: e.target.value })}
          required
          className="w-full p-3 border rounded-lg"
        />

        <select
          value={form.locationId}
          onChange={(e) => setForm({ ...form, locationId: e.target.value })}
          required
          className="w-full p-3 border rounded-lg"
        >
          <option value="">Localização</option>
          {locations.map((loc) => {
            return (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            );
          })}
        </select>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
        >
          {isLoading ? "Finalizando..." : "Concluir Pesquisa"}
        </button>
      </form>
    </div>
  );
}
