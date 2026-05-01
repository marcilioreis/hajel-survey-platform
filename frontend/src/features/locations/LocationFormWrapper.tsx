import { useParams } from "react-router-dom";
import { useGetLocationsQuery } from "../surveys/surveysApi";
import LocationForm from "./LocationForm";

export default function LocationFormWrapper() {
  const { id } = useParams<{ id: string }>();
  const { data: locations, isLoading } = useGetLocationsQuery();

  if (isLoading) {
    return <div className="p-4 text-center">Carregando...</div>;
  }

  const location = locations?.find((l) => l.id === Number(id));

  if (!location) {
    return (
      <div className="p-4 text-center text-red-600">Local não encontrado.</div>
    );
  }

  return <LocationForm initialLocation={location} />;
}
