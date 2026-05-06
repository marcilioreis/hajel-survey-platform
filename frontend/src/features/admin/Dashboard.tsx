import { useNavigate, Link } from "react-router-dom";
import { useGetSurveysQuery } from "../surveys/surveysApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, CheckCircle, MessageSquare } from "lucide-react";

function StatsCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: surveys } = useGetSurveysQuery();
  const totalSurveys = surveys?.length ?? 0;
  const activeSurveys = surveys?.filter((s) => s.active).length ?? 0;
  const totalResponses =
    surveys?.reduce((sum, s) => sum + s.responsesCount, 0) ?? 0;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link
          to="/surveys"
          className="text-sm text-muted-foreground hover:text-primary"
        >
          ← Voltar para pesquisas
        </Link>
      </div>

      {/* Cards de indicadores */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          label="Pesquisas"
          value={totalSurveys}
          icon={ClipboardList}
        />
        <StatsCard label="Ativas" value={activeSurveys} icon={CheckCircle} />
        <StatsCard
          label="Respostas"
          value={totalResponses}
          icon={MessageSquare}
        />
      </div>

      {/* Pesquisas Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Pesquisas Recentes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Respostas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {surveys?.slice(0, 5).map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">
                    <Link to={`/surveys/${s.id}`} className="hover:underline">
                      {s.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.active ? "default" : "secondary"}>
                      {s.active ? "Ativa" : "Encerrada"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {s.responsesCount}
                  </TableCell>
                </TableRow>
              ))}
              {(!surveys || surveys.length === 0) && (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-muted-foreground"
                  >
                    Nenhuma pesquisa encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Links de administração */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card
          className="hover:bg-muted/50 transition-colors cursor-pointer"
          onClick={() => navigate("/admin/users")}
        >
          <CardHeader>
            <CardTitle className="text-sm">Gerenciar Usuários</CardTitle>
          </CardHeader>
        </Card>
        <Card
          className="hover:bg-muted/50 transition-colors cursor-pointer"
          onClick={() => navigate("/admin/roles")}
        >
          <CardHeader>
            <CardTitle className="text-sm">Gerenciar Permissões</CardTitle>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
