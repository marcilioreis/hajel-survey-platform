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
        <div
          key={question.questionId}
          className="bg-white p-4 rounded-lg shadow-sm"
        >
          <h3 className="font-medium text-gray-900 mb-2">
            {question.questionText}
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            {question.responses.length} resposta(s) • {question.type}
          </p>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {question.responses.map((resp, idx) => (
              <div
                key={idx}
                className="p-2 bg-gray-50 rounded text-sm text-gray-700"
              >
                {resp}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
