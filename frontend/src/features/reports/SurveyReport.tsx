import { useParams, useNavigate } from "react-router-dom";
import { useGetSurveyResultsQuery } from "../surveys/surveysApi";
import ReportCharts from "./ReportCharts";

export default function SurveyReport() {
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();
  const {
    data: results,
    isLoading,
    error,
  } = useGetSurveyResultsQuery(surveyId!);

  if (isLoading) {
    return <div className="p-4 text-center">Carregando resultados...</div>;
  }

  if (error || !results) {
    return (
      <div className="p-4 text-center text-red-600">
        Não foi possível carregar os resultados desta pesquisa.
        <button
          onClick={() => navigate("/surveys")}
          className="block mx-auto mt-2 text-blue-600"
        >
          Voltar para pesquisas
        </button>
      </div>
    );
  }

  return (
    <div className="pb-20">
      <div className="p-4">
        <button onClick={() => navigate(-1)} className="mb-4 text-blue-600">
          ← Voltar
        </button>
        <ReportCharts results={results} />
      </div>
    </div>
  );
}
