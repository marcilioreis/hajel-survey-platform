import { useParams } from "react-router-dom";
import SurveyForm from "./SurveyForm";

export default function SurveyFormWrapper() {
  const { id } = useParams<{ id: string }>();
  // Força remontagem quando o id muda
  return <SurveyForm key={id ?? "new"} />;
}
