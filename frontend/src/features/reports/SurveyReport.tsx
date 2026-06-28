import { useParams, useNavigate } from "react-router-dom";
import {
  useGetSurveyResultsQuery,
  useGetOpenResponsesQuery,
  useGetSurveyByIdQuery,
} from "../surveys/surveysApi";
import ReportCharts from "./ReportCharts";
import OpenResponsesList from "./OpenResponsesList";
import SamplingInfoCard from "../surveys/SamplingInfoCard";
import ExportButton from "./ExportButton";
import Skeleton from "@/components/common/Skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

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
  const { data: survey } = useGetSurveyByIdQuery(surveyId!);

  if (loadingResults || loadingOpen) {
    return (
      <div className="p-4 text-center">
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
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        {surveyId && <ExportButton surveyId={surveyId} />}
      </div>

      {survey && <SamplingInfoCard survey={survey} showCollected />}

      {results && results.length > 0 && <ReportCharts results={results} />}
      {openResponses && openResponses.length > 0 && (
        <OpenResponsesList responses={openResponses} />
      )}
      {(!results || results.length === 0) &&
        (!openResponses || openResponses.length === 0) && (
          <p className="text-center text-muted-foreground">
            Nenhum resultado disponível.
          </p>
        )}
    </div>
  );
}
