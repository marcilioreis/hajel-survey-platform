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
                className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                title="Editar local"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                Editar
              </button>
              <button
                onClick={() => handleDelete(loc.id)}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                title="Excluir local"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
