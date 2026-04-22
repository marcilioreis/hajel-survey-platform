import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  useGetSurveyByIdQuery,
  useSubmitResponsesMutation,
} from "./surveysApi";

// Tipo para respostas locais (chave: questionId, valor: string ou array)
type AnswersMap = Record<number, string | string[]>;

// Carrega respostas salvas do localStorage de forma segura
const loadSavedAnswers = (surveyId: string): AnswersMap => {
  try {
    const saved = localStorage.getItem(`survey-${surveyId}-answers`);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

export default function SurveyExecution() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: survey, isLoading } = useGetSurveyByIdQuery(id!);
  const [submitResponses, { isLoading: isSubmitting }] =
    useSubmitResponsesMutation();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswersMap>(() =>
    id ? loadSavedAnswers(id) : {},
  );

  // Salva respostas no localStorage sempre que houver mudanças
  useEffect(() => {
    if (id && Object.keys(answers).length > 0) {
      localStorage.setItem(`survey-${id}-answers`, JSON.stringify(answers));
    }
  }, [answers, id]);

  if (isLoading) {
    return <div className="p-4 text-center">Carregando pesquisa...</div>;
  }

  if (!survey) {
    return (
      <div className="p-4 text-center text-red-600">
        Pesquisa não encontrada.
      </div>
    );
  }

  const questions = survey.questions;
  const currentQuestion = questions[currentIndex];
  const currentAnswer = currentQuestion
    ? answers[currentQuestion.id]
    : undefined;

  const handleAnswerChange = (value: string | string[]) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    // Valida perguntas obrigatórias não respondidas
    const unansweredRequired = questions.filter(
      (q) => q.required && !answers[q.id],
    );
    if (unansweredRequired.length > 0) {
      toast.error(
        `Há ${unansweredRequired.length} pergunta(s) obrigatória(s) sem resposta.`,
      );
      const firstUnanswered = questions.findIndex(
        (q) => q.required && !answers[q.id],
      );
      if (firstUnanswered !== -1) setCurrentIndex(firstUnanswered);
      return;
    }

    const payload = {
      surveyId: Number(id),
      answers: Object.entries(answers).map(([questionId, value]) => ({
        questionId: Number(questionId),
        value,
      })),
    };

    try {
      await submitResponses(payload).unwrap();
      localStorage.removeItem(`survey-${id}-answers`);
      toast.success("Respostas enviadas com sucesso!");
      navigate("/surveys");
    } catch {
      toast.error("Erro ao enviar respostas. Tente novamente.");
    }
  };

  const isLast = currentIndex === questions.length - 1;
  const progressPercent = ((currentIndex + 1) / questions.length) * 100;

  // Renderização da pergunta conforme o tipo
  const renderQuestionInput = () => {
    if (!currentQuestion) return null;

    const q = currentQuestion;

    switch (q.type) {
      case "texto_longo":
        return (
          <textarea
            value={(currentAnswer as string) || ""}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="Digite sua resposta..."
            className="w-full p-3 border border-gray-300 rounded-lg text-base"
            rows={q.type === "texto_longo" ? 6 : 3}
          />
        );

      case "unica_escolha":
        return (
          <div className="space-y-3">
            {q.options.map((opt, idx) => (
              <label
                key={idx}
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg"
              >
                <input
                  type="radio"
                  name={`q-${q.id}`}
                  value={opt}
                  checked={currentAnswer === opt}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  className="w-5 h-5 text-blue-600"
                />
                <span className="text-base">{opt}</span>
              </label>
            ))}
          </div>
        );

      case "multipla_escolha":
        return (
          <div className="space-y-3">
            {q.options.map((opt, idx) => {
              const isChecked =
                Array.isArray(currentAnswer) && currentAnswer.includes(opt);
              return (
                <label
                  key={idx}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg"
                >
                  <input
                    type="checkbox"
                    value={opt}
                    checked={isChecked}
                    onChange={(e) => {
                      const arr = Array.isArray(currentAnswer)
                        ? [...currentAnswer]
                        : [];
                      if (e.target.checked) {
                        arr.push(opt);
                      } else {
                        const index = arr.indexOf(opt);
                        if (index > -1) arr.splice(index, 1);
                      }
                      handleAnswerChange(arr);
                    }}
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                  <span className="text-base">{opt}</span>
                </label>
              );
            })}
          </div>
        );

      default:
        return <div>Tipo de pergunta não suportado.</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Barra de progresso */}
      <div className="bg-white p-4 shadow-sm">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>
            Pergunta {currentIndex + 1} de {questions.length}
          </span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Conteúdo da pergunta */}
      <div className="flex-1 p-4">
        <h2 className="text-xl font-medium mb-4">
          {currentQuestion.text}
          {currentQuestion.required && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </h2>
        {renderQuestionInput()}
      </div>

      {/* Navegação */}
      <div className="bg-white p-4 border-t flex justify-between">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="px-4 py-2 text-blue-600 disabled:text-gray-400"
        >
          Anterior
        </button>
        {isLast ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50"
          >
            {isSubmitting ? "Enviando..." : "Finalizar"}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg"
          >
            Próxima
          </button>
        )}
      </div>
    </div>
  );
}
