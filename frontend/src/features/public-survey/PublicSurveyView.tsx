import { useParams, useNavigate } from "react-router-dom";
import {
  useGetPublicSurveyQuery,
  useStartSessionMutation,
} from "./publicSurveyApi";
import toast from "react-hot-toast";

export default function PublicSurveyView() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: survey, isLoading, error } = useGetPublicSurveyQuery(slug!);
  const [startSession, { isLoading: isStarting }] = useStartSessionMutation();

  const handleStart = async () => {
    if (!slug) return;
    try {
      const { token } = await startSession(slug).unwrap();
      // Armazena token no localStorage (decisão consciente)
      localStorage.setItem(`survey-token-${slug}`, token);
      // Navega para a página de sessão
      navigate(`/s/${slug}/session`);
    } catch {
      toast.error("Não foi possível iniciar a pesquisa. Tente novamente.");
    }
  };

  if (isLoading) return <div className="p-4">Carregando pesquisa...</div>;
  if (error || !survey) {
    return (
      <div className="p-4 text-center">
        <h1 className="text-xl font-bold text-red-600">
          Pesquisa não encontrada ou indisponível.
        </h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 p-4 flex flex-col justify-center max-w-md mx-auto w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {survey.title}
        </h1>
        {survey.description && (
          <p className="text-gray-600 mb-6 p-2">{survey.description}</p>
        )}
        <button
          onClick={handleStart}
          disabled={isStarting}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
        >
          {isStarting ? "Iniciando..." : "Iniciar Pesquisa"}
        </button>
        <p className="text-xs text-gray-500 mt-4 text-center">
          Suas respostas serão salvas automaticamente. Você pode interromper e
          continuar depois.
        </p>
      </div>
    </div>
  );
}
