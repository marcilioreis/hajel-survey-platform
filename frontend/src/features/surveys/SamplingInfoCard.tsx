import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { BackendSurvey } from "./surveys.types";
import {
  adjustSampleForResponseRate,
  formatPercent,
} from "../../utils/statistics";

interface Props {
  survey: Pick<
    BackendSurvey,
    | "sample_size"
    | "margin_of_error"
    | "population_size"
    | "confidence_level"
    | "expected_proportion"
    | "response_rate"
    | "responses_count"
  >;
  /** Quando true, mostra o indicador de progresso planejado × coletado. */
  showCollected?: boolean;
}

export default function SamplingInfoCard({
  survey,
  showCollected = false,
}: Props) {
  const hasSampling =
    survey.sample_size != null || survey.margin_of_error != null;
  if (!hasSampling) return null;

  const collected = survey.responses_count ?? 0;
  const planned = survey.sample_size ?? null;
  const pct =
    planned && planned > 0
      ? Math.min(100, Math.round((collected / planned) * 100))
      : null;
  const reached = planned != null && collected >= planned;
  const adjusted =
    planned != null
      ? adjustSampleForResponseRate(planned, survey.response_rate ?? null)
      : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ficha técnica da amostra</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          {survey.margin_of_error != null && (
            <Field
              label="Margem de erro"
              value={formatPercent(survey.margin_of_error)}
            />
          )}
          {planned != null && (
            <Field
              label="Amostra planejada"
              value={planned.toLocaleString("pt-BR")}
            />
          )}
          {survey.confidence_level != null && (
            <Field
              label="Nível de confiança"
              value={formatPercent(survey.confidence_level, 0)}
            />
          )}
          {survey.expected_proportion != null && (
            <Field
              label="Proporção esperada"
              value={formatPercent(survey.expected_proportion, 0)}
            />
          )}
          {survey.population_size != null && (
            <Field
              label="População"
              value={survey.population_size.toLocaleString("pt-BR")}
            />
          )}
          {survey.response_rate != null && (
            <Field
              label="Taxa de resposta"
              value={formatPercent(survey.response_rate, 0)}
            />
          )}
          {adjusted != null && planned != null && adjusted !== planned && (
            <Field
              label="Abordagens necessárias"
              value={adjusted.toLocaleString("pt-BR")}
            />
          )}
        </div>

        {showCollected && planned != null && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Coletado: {collected.toLocaleString("pt-BR")} /{" "}
                {planned.toLocaleString("pt-BR")}
              </span>
              {reached ? (
                <Badge>Meta atingida</Badge>
              ) : (
                <Badge variant="secondary">
                  Faltam {(planned - collected).toLocaleString("pt-BR")}
                </Badge>
              )}
            </div>
            {pct != null && <Progress value={pct} />}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="font-semibold text-base">{value}</p>
    </div>
  );
}
