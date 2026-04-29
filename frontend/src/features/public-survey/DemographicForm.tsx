import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useGetPublicSurveyQuery } from "./publicSurveyApi";

export default function DemographicForm() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const token = slug ? localStorage.getItem(`survey-token-${slug}`) : null;
  const { data: survey } = useGetPublicSurveyQuery(slug!, { skip: !slug });

  const [form, setForm] = useState({
    ageRange: "",
    gender: "",
    incomeRange: "",
    education: "",
    occupation: "",
    locationId: "",
  });

  // Redirecionamento seguro via useEffect
  useEffect(() => {
    if (!token || !survey) {
      navigate(`/s/${slug}`);
    }
  }, [token, survey, slug, navigate]);

  // Agora o componente sempre retorna o mesmo JSX inicialmente,
  // e o redirecionamento ocorre como efeito colateral após a montagem.
  if (!token || !survey) {
    return null; // ou um loading spinner
  }

  const locations = survey.locations || [];

  const triggerVibration = () => {
    if ("vibrate" in navigator) {
      // Vibrate for 30ms, pause for 50ms, vibrate for 30ms
      navigator.vibrate([30, 50, 30]);
    } else {
      console.log("Vibration API not supported");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.values(form).some((v) => !v)) {
      toast.error("Preencha todos os campos.");
      return;
    }

    // Salva dados demográficos no localStorage
    localStorage.setItem(`survey-${slug}-demographics`, JSON.stringify(form));
    triggerVibration();
    navigate(`/s/${slug}/session`);
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

        <select
          value={form.education}
          onChange={(e) => setForm({ ...form, education: e.target.value })}
          required
          className="w-full p-3 border rounded-lg"
        >
          <option value="">Escolaridade</option>
          <option value="NA">Não alfabetizado</option>
          <option value="ENSINO_FUNDAMENTAL">Ensino Fundamental</option>
          <option value="ENSINO_MEDIO">Ensino Médio</option>
          <option value="ENSINO_SUPERIOR">Ensino Superior</option>
        </select>

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
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
        >
          Avançar para perguntas
        </button>
      </form>
    </div>
  );
}
