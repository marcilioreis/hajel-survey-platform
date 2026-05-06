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
import Skeleton from "@/components/common/Skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Search, Filter, ArrowUpDown } from "lucide-react";

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
          (Number(a.responsesCount) || 0) - (Number(b.responsesCount) || 0);
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  if (isLoading) {
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
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        Erro ao carregar pesquisas.
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Barra de pesquisa e botão nova pesquisa */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar pesquisa..."
            value={searchTerm}
            onChange={(e) => dispatch(setSearchTerm(e.target.value))}
            className="pl-9"
            data-testid="survey-search"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
          data-testid="survey-toggle-filters"
        >
          <Filter className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => navigate("/surveys/new")}
          data-testid="survey-new"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Nova Pesquisa
        </Button>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="flex gap-4 items-center bg-white p-4 rounded-lg shadow-sm">
          <div className="flex-1">
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                dispatch(setStatusFilter(value as typeof statusFilter))
              }
            >
              <SelectTrigger data-testid="survey-filter-status">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="rascunho">Rascunho</SelectItem>
                <SelectItem value="ativa">Ativa</SelectItem>
                <SelectItem value="encerrada">Encerrada</SelectItem>
                <SelectItem value="inativa">Inativa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Select
              value={sortBy}
              onValueChange={(value) =>
                dispatch(setSortBy(value as typeof sortBy))
              }
            >
              <SelectTrigger data-testid="survey-filter-sort">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Data</SelectItem>
                <SelectItem value="title">Título</SelectItem>
                <SelectItem value="responsesCount">Respostas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => dispatch(toggleSortOrder())}
            data-testid="survey-toggle-order"
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Tabela */}
      {filteredSurveys.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Nenhuma pesquisa encontrada.
        </div>
      ) : (
        <div className="rounded-lg border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Perguntas</TableHead>
                <TableHead>Respostas</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>Fim</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSurveys.map((survey) => (
                <TableRow
                  key={survey.id}
                  onClick={() => navigate(`/surveys/${survey.id}`)}
                  className="cursor-pointer hover:bg-muted/50"
                  data-testid={`survey-item-${survey.id}`}
                >
                  <TableCell className="font-medium">{survey.title}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        survey.status === "ativa"
                          ? "default"
                          : survey.status === "rascunho"
                            ? "secondary"
                            : survey.status === "encerrada"
                              ? "outline"
                              : "destructive"
                      }
                    >
                      {survey.status === "ativa"
                        ? "Ativa"
                        : survey.status === "rascunho"
                          ? "Rascunho"
                          : survey.status === "encerrada"
                            ? "Encerrada"
                            : "Inativa"}
                    </Badge>
                  </TableCell>
                  <TableCell>{survey.questions.length}</TableCell>
                  <TableCell>{survey.responsesCount ?? 0}</TableCell>
                  <TableCell className="text-xs">
                    {new Date(survey.startDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-xs">
                    {new Date(survey.endDate).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
