import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useGetSurveyByIdQuery, useDeleteSurveyMutation } from "./surveysApi";
import { useAppDispatch } from "../../app/hooks";
import { api } from "../../lib/api";
import { parseBackendDate } from "../../utils/date";
import { getOptionText } from "../../utils/text";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SamplingInfoCard from "./SamplingInfoCard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function SurveyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: survey, isLoading } = useGetSurveyByIdQuery(id!);
  const [deleteSurvey, { isLoading: isDeleting }] = useDeleteSurveyMutation();
  const dispatch = useAppDispatch();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteSurvey(id).unwrap();
      dispatch(api.util.invalidateTags(["Survey"]));
      await new Promise((resolve) => setTimeout(resolve, 0));
      toast.success("Pesquisa excluída com sucesso.");
      navigate("/surveys");
    } catch {
      toast.error("Erro ao excluir pesquisa.");
    } finally {
      setShowDeleteDialog(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white p-4 rounded-lg shadow-sm space-y-2">
            <div className="h-5 w-3/4 bg-gray-200 animate-pulse rounded" />
            <div className="h-4 w-1/2 bg-gray-200 animate-pulse rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!survey) return null;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">{survey.title}</CardTitle>
            <Badge variant={survey.active ? "default" : "secondary"}>
              {survey.active ? "Ativa" : "Encerrada"}
            </Badge>
          </div>
          {survey.description && (
            <p className="text-muted-foreground">{survey.description}</p>
          )}
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
          <div>
            Início: {parseBackendDate(survey.start_date).toLocaleDateString()}
          </div>
          <div>
            Fim: {parseBackendDate(survey.end_date).toLocaleDateString()}
          </div>
        </CardContent>
      </Card>

      <SamplingInfoCard survey={survey} />

      <Card>
        <CardHeader>
          <CardTitle>Perguntas ({survey.questions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4 list-decimal list-inside text-left">
            {survey.questions.map((q) => (
              <li key={q.id} className="text-gray-700">
                <span className="font-medium">{q.text}</span>
                {q.required && <span className="text-red-500 ml-1">*</span>}
                {q.type !== "texto_longo" && q.options.length > 0 && (
                  <ul className="ml-6 mt-1 list-disc text-sm text-gray-500">
                    {q.options.map((opt, idx) => (
                      <li key={idx}>{getOptionText(opt)}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        <Button onClick={() => navigate(`/surveys/${id}/edit`)}>
          Editar Pesquisa
        </Button>
        {survey.status === "ativa" && (
          <Button
            variant="secondary"
            onClick={() => navigate(`/surveys/${id}/execute`)}
          >
            Iniciar Coleta
          </Button>
        )}
        {survey.responses_count > 0 && (
          <Button
            variant="secondary"
            onClick={() => navigate(`/reports/${id}`)}
          >
            Ver Resultados
          </Button>
        )}
        <Button
          variant="destructive"
          onClick={() => setShowDeleteDialog(true)}
          disabled={isDeleting}
        >
          {isDeleting ? "Excluindo..." : "Excluir Pesquisa"}
        </Button>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta pesquisa? Esta ação não pode
              ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
