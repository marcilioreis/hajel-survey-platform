import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  useGetPublicSurveyQuery,
  useGetProgressQuery,
  useSubmitAnswersBatchMutation,
} from "./publicSurveyApi";
import type { AnswerPayload } from "./publicSurvey.types";

export default function SurveySession() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const token = slug ? localStorage.getItem(`survey-token-${slug}`) : null;

  useEffect(() => {
    if (!token && slug) {
      toast.error("Sessão não encontrada. Inicie novamente.");
      navigate(`/s/${slug}`);
    }
  }, [token, slug, navigate]);

  const { data: survey } = useGetPublicSurveyQuery(slug!, { skip: !slug });
  const { data: progress } = useGetProgressQuery(token!, { skip: !token });
  const [submitAnswersBatch, { isLoading: isSubmitting }] =
    useSubmitAnswersBatchMutation();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({});
  const initializedRef = useRef(false);

  // Restaura respostas do progresso
  useEffect(() => {
    if (!initializedRef.current && progress?.answers) {
      const mapped = progress.answers.reduce(
        (acc, ans) => {
          acc[ans.questionId] = ans.value;
          return acc;
        },
        {} as Record<number, string | string[]>,
      );
      setAnswers(mapped);
      initializedRef.current = true;
    }
  }, [progress]);

  const questions = survey?.questions || [];
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

  const handleFinish = async () => {
    const allAnswers: AnswerPayload[] = Object.entries(answers).map(
      ([qId, value]) => ({
        questionId: Number(qId),
        value,
      }),
    );

    if (allAnswers.length === 0) {
      toast.error("Responda pelo menos uma pergunta.");
      return;
    }

    try {
      await submitAnswersBatch({ token: token!, body: allAnswers }).unwrap();
      navigate(`/s/${slug}/demographics`);
    } catch {
      toast.error("Erro ao enviar respostas. Verifique sua conexão.");
    }
  };

  if (!survey || !token) return <div className="p-4">Carregando...</div>;

  const isLast = currentIndex === questions.length - 1;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Barra de progresso (mantida) */}
      <div className="bg-white p-4 shadow-sm">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>
            Pergunta {currentIndex + 1} de {questions.length}
          </span>
          <span>
            {Math.round(((currentIndex + 1) / questions.length) * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{
              width: `${((currentIndex + 1) / questions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Conteúdo da pergunta (mantido) */}
      <div className="flex-1 p-4">
        <h2 className="text-xl font-medium mb-4">
          {currentQuestion.text}
          {currentQuestion.required && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </h2>

        {/* Renderização condicional por tipo (idêntica à anterior) */}
        {currentQuestion.type === "texto_longo" ? (
          <textarea
            value={(currentAnswer as string) || ""}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="Digite sua resposta..."
            className="w-full p-3 border border-gray-300 rounded-lg text-base"
            rows={currentQuestion.type === "texto_longo" ? 6 : 3}
          />
        ) : currentQuestion.type === "unica_escolha" ? (
          <div className="space-y-3">
            {currentQuestion.options.map((opt, idx) => (
              <label
                key={idx}
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg"
              >
                <input
                  type="radio"
                  name={`q-${currentQuestion.id}`}
                  value={opt}
                  checked={currentAnswer === opt}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  className="w-5 h-5 text-blue-600"
                />
                <span className="text-base">{opt}</span>
              </label>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {currentQuestion.options.map((opt, idx) => (
              <label
                key={idx}
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg"
              >
                <input
                  type="checkbox"
                  value={opt}
                  checked={
                    Array.isArray(currentAnswer) && currentAnswer.includes(opt)
                  }
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
            ))}
          </div>
        )}
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
            onClick={handleFinish}
            disabled={isSubmitting}
            className="px-6 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50"
          >
            {isSubmitting ? "Enviando..." : "Concluir respostas"}
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
