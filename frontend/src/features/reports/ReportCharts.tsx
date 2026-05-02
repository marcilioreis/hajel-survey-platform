import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { RectangleProps } from "recharts"; // import somente o tipo
import type { QuestionResult } from "../surveys/surveys.types";

interface ReportChartsProps {
  results: QuestionResult[];
}

// Geração dinâmica de cores por índice
const getBarColor = (index: number) => {
  const hue = (index * 137.508) % 360;
  return `hsl(${hue}, 65%, 55%)`;
};

// Estendemos RectangleProps para incluir o índice
interface BarShapeProps extends RectangleProps {
  index: number;
}

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
          <div
            key={question.questionId}
            className="bg-white p-4 rounded-lg shadow-sm"
          >
            <h3 className="font-medium text-gray-900 mb-2">
              {question.questionText}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              {question.totalResponses} resposta(s) •{" "}
              {question.data.reduce((sum, row) => sum + row.count, 0)} total
            </p>

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
          </div>
        );
      })}
    </div>
  );
}
