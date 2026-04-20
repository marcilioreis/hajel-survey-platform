import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useGetSurveyByIdQuery, useDeleteSurveyMutation } from "./surveysApi";

export default function SurveyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: survey, isLoading } = useGetSurveyByIdQuery(id!);
  const [deleteSurvey, { isLoading: isDeleting }] = useDeleteSurveyMutation();

  const handleDelete = async () => {
    if (!id || !confirm("Tem certeza que deseja excluir esta pesquisa?"))
      return;
    try {
      await deleteSurvey(id).unwrap();
      toast.success("Pesquisa excluída com sucesso.");
      navigate("/surveys");
    } catch {
      toast.error("Erro ao excluir pesquisa.");
    }
  };

  const handleStartCollection = () => {
    // Na Fase 3 implementaremos a execução
    navigate(`/surveys/${id}/execute`);
  };

  if (isLoading) {
    return <div className="p-4">Carregando...</div>;
  }

  if (!survey) return null;

  const statusLabel = survey.active ? "Ativa" : "Encerrada";
  const statusClass = survey.active
    ? "bg-green-100 text-green-800"
    : "bg-gray-100 text-gray-800";

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex justify-between items-start">
          <h1 className="text-xl font-bold">{survey.title}</h1>
          <span className={`text-xs px-2 py-1 rounded-full ${statusClass}`}>
            {statusLabel}
          </span>
        </div>
        {survey.description && (
          <p className="text-gray-600 mt-2">{survey.description}</p>
        )}
        <p className="text-sm text-gray-400 mt-2">
          Criada em {new Date(survey.created_at).toLocaleDateString()}
        </p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h2 className="font-medium mb-3">
          Perguntas ({survey.questions.length})
        </h2>
        <ol className="space-y-3 list-decimal list-inside">
          {survey.questions.map((q) => (
            <li key={q.id} className="text-gray-700">
              <span className="font-medium">{q.text}</span>
              {q.required && <span className="text-red-500 ml-1">*</span>}
              {q.type !== "texto" && q.options.length > 0 && (
                <ul className="ml-6 mt-1 list-disc text-sm text-gray-500">
                  {q.options.map((opt, idx) => (
                    <li key={idx}>{opt}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={() => navigate(`/surveys/${id}/edit`)}
          className="py-3 bg-blue-600 text-white rounded-lg font-medium"
        >
          Editar Pesquisa
        </button>
        {survey.status === "ativa" && (
          <button
            onClick={handleStartCollection}
            className="py-3 bg-green-600 text-white rounded-lg font-medium"
          >
            Iniciar Coleta
          </button>
        )}
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="py-3 border border-red-300 text-red-600 rounded-lg font-medium"
        >
          {isDeleting ? "Excluindo..." : "Excluir Pesquisa"}
        </button>
      </div>
    </div>
  );
}
