import { useParams, useNavigate } from "react-router-dom";
import {
  useGetSurveyResultsQuery,
  useGetOpenResponsesQuery,
} from "../surveys/surveysApi";
import ReportCharts from "./ReportCharts";
import OpenResponsesList from "./OpenResponsesList"; // novo componente
import Skeleton from "../../components/common/Skeleton";

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
