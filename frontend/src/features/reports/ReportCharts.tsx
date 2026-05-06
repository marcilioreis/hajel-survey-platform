import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  type RectangleProps,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { QuestionResult } from "../surveys/surveys.types";

interface ReportChartsProps {
  results: QuestionResult[];
}

interface BarShapeProps extends RectangleProps {
  index: number;
}

// Geração dinâmica de cores
const getBarColor = (index: number) => {
  const hue = (index * 137.508) % 360;
  return `hsl(${hue}, 65%, 55%)`;
};

const CustomBar = (props: BarShapeProps) => {
  const { x, y, width, height, index } = props;
  const fill = getBarColor(index);
  return (
    <rect x={x} y={y} width={width} height={height} fill={fill} rx={4} ry={4} />
  );
};

export default function ReportCharts({ results }: ReportChartsProps) {
  return (
    <div className="space-y-6">
      {results.map((question) => {
        if (
          question.type === "texto_longo" ||
          question.type === "texto_curto"
        ) {
          return null;
        }

        return (
          <Card key={question.questionId}>
            <CardHeader>
              <CardTitle className="text-base">
                {question.questionText}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {question.totalResponses} resposta(s) •{" "}
                {question.data.reduce((sum, row) => sum + row.count, 0)} total
              </p>
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={question.data}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="option" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar
                    dataKey="count"
                    shape={(props: BarShapeProps) => <CustomBar {...props} />}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
