import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGetSurveysQuery } from "./surveysApi";
import { useAppSelector, useAppDispatch } from "../../app/hooks";
import {
  setSearchTerm,
  setStatusFilter,
  setSortBy,
  toggleSortOrder,
} from "./surveysSlice";

export default function SurveyList() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { searchTerm, statusFilter, sortBy, sortOrder } = useAppSelector(
    (state) => state.surveys,
  );
  const {
    data: surveysData,
    isLoading,
    error,
  } = useGetSurveysQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const surveys = Array.isArray(surveysData) ? surveysData : [];
  const [showFilters, setShowFilters] = useState(false);

  // Filtragem e ordenação locais (pode ser delegada à API futuramente)
  const filteredSurveys = surveys
    .filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (
        searchTerm &&
        !s.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
        return false;
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === "createdAt") {
        comparison =
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === "title") {
        comparison = a.title.localeCompare(b.title);
      } else if (sortBy === "responsesCount") {
        comparison =
          (Number(a.responses_count) || 0) - (Number(b.responses_count) || 0);
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  console.log("filteredSurveys :>> ", filteredSurveys);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        Erro ao carregar pesquisas.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barra de pesquisa e filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Buscar pesquisa..."
            value={searchTerm}
            onChange={(e) => dispatch(setSearchTerm(e.target.value))}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-base"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
          >
            ⚙️
          </button>
        </div>

        {showFilters && (
          <div className="space-y-3 pt-2 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) =>
                  dispatch(
                    setStatusFilter(e.target.value as typeof statusFilter),
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-base"
              >
                <option value="all">Todos</option>
                <option value="active">Ativa</option>
                <option value="ended">Encerrada</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ordenar por
              </label>
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) =>
                    dispatch(setSortBy(e.target.value as typeof sortBy))
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-base"
                >
                  <option value="createdAt">Data</option>
                  <option value="title">Título</option>
                  <option value="responsesCount">Respostas</option>
                </select>
                <button
                  onClick={() => dispatch(toggleSortOrder())}
                  className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Botão nova pesquisa */}
      <button
        onClick={() => navigate("/surveys/new")}
        className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
      >
        + Nova Pesquisa
      </button>

      {/* Lista de pesquisas */}
      {filteredSurveys.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Nenhuma pesquisa encontrada.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSurveys.map((survey) => (
            <div
              key={survey.id}
              onClick={() => navigate(`/surveys/${survey.id}`)}
              className="bg-white p-4 rounded-lg shadow-sm active:bg-gray-50"
            >
              <div className="flex justify-between items-start">
                <h3 className="font-medium text-gray-900">{survey.title}</h3>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    survey.status === "ativa"
                      ? "bg-green-100 text-green-800"
                      : survey.status === "rascunho"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {survey.status === "ativa"
                    ? "Ativa"
                    : survey.status === "rascunho"
                      ? "Rascunho"
                      : "Encerrada"}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {survey.questions.length} pergunta(s)
                {survey.responses_count !== undefined &&
                  ` • ${survey.responses_count} resposta(s)`}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Criada em: {new Date(survey.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
