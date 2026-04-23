import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useGetSurveyByIdQuery, useDeleteSurveyMutation } from "./surveysApi";
import { useAppDispatch } from "../../app/hooks";
import { api } from "../../lib/api";

export default function SurveyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: survey, isLoading } = useGetSurveyByIdQuery(id!);
  const [deleteSurvey, { isLoading: isDeleting }] = useDeleteSurveyMutation();
  const dispatch = useAppDispatch();

  const confirmDelete = () => {
    toast.custom(
      (t) => (
        <div
          className={`max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-opacity-5`}
        >
          <div className="p-4">
            <p className="text-sm font-medium text-gray-900">
              Tem certeza que deseja excluir esta pesquisa?
            </p>
          </div>
          <div className="flex border-gray-200">
            <button
              type="button"
              onClick={() => {
                handleDelete();
                toast.dismiss(t);
              }}
              className="w-full border border-transparent rounded-none rounded-r-lg p-2 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none"
            >
              Confirmar
            </button>
            <button
              type="button"
              onClick={() => toast.dismiss(t)}
              className="w-full border border-transparent rounded-none p-2 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-500 focus:outline-none"
            >
              Cancelar
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity, // Keeps the dialog visible until user takes action
      },
    );
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteSurvey(id).unwrap();
      console.log("Survey deleted successfully");
      // Invalida todas as queries que dependem de qualquer tag 'Survey'
      dispatch(api.util.invalidateTags(["Survey"]));
      // Aguarda um tick para garantir que as queries sejam canceladas
      await new Promise((resolve) => setTimeout(resolve, 0));
      toast.success("Pesquisa excluída com sucesso.");
      // navigate("/surveys");
      window.location.href = "/surveys";
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
        <span className={`text-xs px-2 py-1 rounded-full ${statusClass}`}>
          {statusLabel}
        </span>
        <div className="flex justify-between items-start">
          <h1 className="p-2 text-2xl w-full">{survey.title}</h1>
        </div>
        {survey.description && (
          <p className="text-gray-600 p-2">{survey.description}</p>
        )}
        <p className="text-sm text-gray-400 mt-2">
          Data de início: {new Date(survey.start_date).toLocaleDateString()}
        </p>
        <p className="text-sm text-gray-400 mt-2">
          Criada em: {new Date(survey.created_at).toLocaleDateString()}
        </p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h2 className="font-medium mb-3 p-2">
          Perguntas ({survey.questions.length})
        </h2>
        <ol className="space-y-3 list-decimal list-inside text-left">
          {survey.questions.map((q) => (
            <li key={q.id} className="text-gray-700">
              <span className="font-medium">{q.text}</span>
              {q.required && <span className="text-red-500 ml-1">*</span>}
              {q.type !== "text" && q.options.length > 0 && (
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
          onClick={confirmDelete}
          disabled={isDeleting}
          className="py-3 border border-red-300 text-red-600 rounded-lg font-medium"
        >
          {isDeleting ? "Excluindo..." : "Excluir Pesquisa"}
        </button>
      </div>
    </div>
  );
}
