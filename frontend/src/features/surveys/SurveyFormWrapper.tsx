import { useParams } from "react-router-dom";
import { useGetSurveyByIdQuery } from "./surveysApi";
import SurveyForm from "./SurveyForm";

export default function SurveyFormWrapper() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const { data: existingSurvey, isLoading } = useGetSurveyByIdQuery(id!, {
    skip: !isEditing,
  });

  // Enquanto carrega, exibe um loader
  if (isEditing && isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // A chave força a remontagem quando o id muda
  return <SurveyForm key={id ?? "new"} initialSurvey={existingSurvey} />;
}
