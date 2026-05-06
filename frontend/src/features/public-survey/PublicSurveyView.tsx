import { useParams, useNavigate } from "react-router-dom";
import {
  useGetPublicSurveyQuery,
  useStartSessionMutation,
} from "./publicSurveyApi";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function PublicSurveyView() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: survey, isLoading, error } = useGetPublicSurveyQuery(slug!);
  const [startSession, { isLoading: isStarting }] = useStartSessionMutation();

  const handleStart = async () => {
    if (!slug) return;
    try {
      const { token } = await startSession(slug).unwrap();
      localStorage.setItem(`survey-token-${slug}`, token);
      navigate(`/s/${slug}/demographics`);
    } catch {
      toast.error("Não foi possível iniciar a pesquisa. Tente novamente.");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-destructive">
              Pesquisa indisponível
            </CardTitle>
            <CardDescription>
              {"status" in error && error.status === 404
                ? "A pesquisa solicitada não foi encontrada."
                : "Não foi possível carregar a pesquisa. Verifique o link ou tente novamente mais tarde."}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!survey) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{survey.title}</CardTitle>
          {survey.description && (
            <CardDescription>{survey.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            className="w-full"
            size="lg"
            onClick={handleStart}
            disabled={isStarting}
          >
            {isStarting ? "Iniciando..." : "Iniciar Pesquisa"}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Suas respostas serão salvas automaticamente. Você pode interromper e
            continuar depois.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
