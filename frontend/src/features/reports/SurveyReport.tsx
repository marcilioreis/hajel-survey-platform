import { useParams, useNavigate } from "react-router-dom";
import {
  useGetSurveyResultsQuery,
  useGetOpenResponsesQuery,
} from "../surveys/surveysApi";
import ReportCharts from "./ReportCharts";
import OpenResponsesList from "./OpenResponsesList"; // novo componente

export default function SurveyReport() {
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();
  const {
    data: results,
    isLoading: loadingResults,
    error: errorResults,
  } = useGetSurveyResultsQuery(surveyId!);
  const {
    data: openResponses,
    isLoading: loadingOpen,
    error: errorOpen,
  } = useGetOpenResponsesQuery(surveyId!);

  if (loadingResults || loadingOpen)
    return <div className="p-4 text-center">Carregando resultados...</div>;
  if ((errorResults || !results) && (errorOpen || !openResponses)) {
    return (
      <div className="p-4 text-center text-red-600">
        Não foi possível carregar os resultados.
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
        {openResponses && openResponses.length > 0 && (
          <OpenResponsesList responses={openResponses} />
        )}
        {results && results.length > 0 && <ReportCharts results={results} />}
        {(!results || results.length === 0) &&
          (!openResponses || openResponses.length === 0) && (
            <p className="text-center text-gray-500">
              Nenhum resultado disponível.
            </p>
          )}
      </div>
    </div>
  );
}
