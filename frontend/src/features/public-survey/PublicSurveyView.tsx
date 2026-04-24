import { useParams, useNavigate } from "react-router-dom";
import {
  useGetPublicSurveyQuery,
  useStartSessionMutation,
} from "./publicSurveyApi";
import { toast } from "sonner";
import Skeleton from "../../components/common/Skeleton";

export default function PublicSurveyView() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: survey, isLoading, error } = useGetPublicSurveyQuery(slug!);
  const [startSession, { isLoading: isStarting }] = useStartSessionMutation();

  const handleStart = async () => {
    if (!slug) return;
    try {
      const { token } = await startSession(slug).unwrap();
      localStorage.setItem(`survey-token-${slug}`, token);
      navigate(`/s/${slug}/session`);
    } catch {
      toast.error("Não foi possível iniciar a pesquisa. Tente novamente.");
    }
  };

  // Tratamento de loading
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white p-4 rounded-lg shadow-sm space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  // Tratamento de erro (incluindo 404)
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Pesquisa indisponível
          </h1>
          <p className="text-gray-600">
            {"status" in error && error.status === 404
              ? "A pesquisa solicitada não foi encontrada."
              : "Não foi possível carregar a pesquisa. Verifique o link ou tente novamente mais tarde."}
          </p>
        </div>
      </div>
    );
  }

  // Caso survey venha undefined mesmo sem erro (por segurança)
  if (!survey) {
    return null; // ou mensagem de erro
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 p-4 flex flex-col justify-center max-w-md mx-auto w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {survey.title}
        </h1>
        {survey.description && (
          <p className="text-gray-600 mb-6">{survey.description}</p>
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
