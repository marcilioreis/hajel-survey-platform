import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { OpenResponse } from "../surveys/surveys.types";

interface OpenResponsesListProps {
  responses: OpenResponse[];
}

export default function OpenResponsesList({
  responses,
}: OpenResponsesListProps) {
  return (
    <div className="space-y-6 mt-6">
      {responses.map((question) => (
        <Card key={question.questionId}>
          <CardHeader>
            <CardTitle className="text-base">{question.questionText}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {question.responses.length} resposta(s) • Pergunta espontanea
            </p>
          </CardHeader>
          <CardContent>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {question.responses.map((resp, idx) => (
                <div key={idx} className="p-2 bg-muted rounded text-sm">
                  {resp}
                </div>
              ))}
              {question.responses.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhuma resposta registrada.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
