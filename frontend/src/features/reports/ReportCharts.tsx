import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { QuestionResult } from "../surveys/surveys.types";

interface ReportChartsProps {
  results: QuestionResult[];
}

export default function ReportCharts({ results }: ReportChartsProps) {
  return (
    <div className="space-y-6">
      {results.map((question) => (
        <div
          key={question.questionId}
          className="bg-white p-4 rounded-lg shadow-sm"
        >
          <h3 className="font-medium text-gray-900 mb-2">
            {question.questionText}
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            {question.totalResponses} resposta(s) •{" "}
            {question.type === "multipla_escolha"
              ? "Múltipla escolha"
              : "Única escolha"}
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
              <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  );
}
