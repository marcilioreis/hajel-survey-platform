import { useNavigate } from "react-router-dom";
import {
  useGetLocationsQuery,
  useDeleteLocationMutation,
} from "../surveys/surveysApi";
import { toast } from "sonner";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

// Type guard para verificar se o erro tem a propriedade 'status'
function isRTKError(err: unknown): err is FetchBaseQueryError {
  return typeof err === "object" && err !== null && "status" in err;
}

export default function LocationList() {
  const { data: locations, isLoading } = useGetLocationsQuery();
  const [deleteLocation] = useDeleteLocationMutation();
  const navigate = useNavigate();

  const handleDelete = async (id: number) => {
    if (!confirm("Excluir este local?")) return;
    try {
      await deleteLocation(id).unwrap();
      toast.success("Local excluído.");
    } catch (err: unknown) {
      if (isRTKError(err)) {
        if (err.status === 409) {
          toast.error(
            "Este local está vinculado a pesquisas e não pode ser excluído.",
          );
        } else {
          toast.error("Erro ao excluir. Tente novamente.");
        }
      } else {
        toast.error("Erro inesperado.");
      }
    }
  };

  if (isLoading) return <div className="p-4">Carregando...</div>;

  return (
    <div className="p-4 pb-20">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Locais</h1>
        <button
          onClick={() => navigate("/locations/new")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Novo Local
        </button>
      </div>
      <div className="space-y-3">
        {locations?.map((loc) => (
          <div
            key={loc.id}
            className="bg-white p-4 rounded-lg shadow-sm flex justify-between items-center"
          >
            <div className="flex flex-col items-start">
              <p className="font-medium">{loc.name}</p>
              <p className="text-sm text-gray-500">
                {loc.city}/{loc.state}{" "}
                {loc.neighborhood && `- ${loc.neighborhood}`}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/locations/${loc.id}/edit`)}
                className="text-blue-600"
              >
                Editar
              </button>
              <button
                onClick={() => handleDelete(loc.id)}
                className="text-red-600"
              >
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
