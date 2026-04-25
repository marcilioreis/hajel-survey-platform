import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  useGetPublicSurveyQuery,
  useGetProgressQuery,
  useSubmitAnswersBatchMutation,
} from "./publicSurveyApi";
import type { AnswerPayload } from "./publicSurvey.types";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import Skeleton from "../../components/common/Skeleton";

type AnswersMap = Record<number, string | string[]>;

export default function SurveySession() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const token = slug ? localStorage.getItem(`survey-token-${slug}`) : null;

  // Redireciona se não houver token
  useEffect(() => {
    if (!token && slug) {
      toast.error(
        "Sessão não encontrada, expirada ou inválida. Inicie novamente.",
      );
      navigate(`/s/${slug}`);
    }
  }, [token, slug, navigate]);

  const { data: survey } = useGetPublicSurveyQuery(slug!, { skip: !slug });
  const { data: progress, error: progressError } = useGetProgressQuery(token!, {
    skip: !token,
  });

  useEffect(() => {
    if (
      progressError &&
      "status" in progressError &&
      (progressError.status === 401 || progressError.status === 404)
    ) {
      toast.error("Erro ao carregar progresso. Inicie novamente.");
      localStorage.removeItem(`survey-token-${slug}`);
      navigate(`/s/${slug}`);
    }
  }, [progressError, slug, navigate]);

  const [submitAnswersBatch, { isLoading: isSubmitting }] =
    useSubmitAnswersBatchMutation();

  // Estado inicial: tenta carregar do localStorage
  const [answers, setAnswers] = useState<AnswersMap>(() => {
    if (slug) {
      const saved = localStorage.getItem(`survey-${slug}-answers`);

      console.log("Loaded from localStorage :>> ", saved);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return {};
        }
      }
    }
    return {};
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const progressAppliedRef = useRef(false);

  // Sincroniza com o progresso do backend apenas se não houver dados locais
  useEffect(() => {
    if (
      !progressAppliedRef.current &&
      progress?.answers &&
      progress.answers.length > 0
    ) {
      const hasLocalAnswers = Object.keys(answers).length > 0;
      if (!hasLocalAnswers) {
        const mapped = progress.answers.reduce((acc, ans) => {
          acc[ans.questionId] = ans.value;
          return acc;
        }, {} as AnswersMap);
        // Agendamento para próximo ciclo elimina o aviso
        queueMicrotask(() => setAnswers(mapped));
      }
      progressAppliedRef.current = true;
    }
  }, [progress, answers]);

  // Persiste respostas no localStorage
  useEffect(() => {
    if (slug && Object.keys(answers).length > 0) {
      localStorage.setItem(`survey-${slug}-answers`, JSON.stringify(answers));
    }
  }, [answers, slug]);

  function isSessionExpiredError(error: unknown): boolean {
    if (!error) return false;

    // Trata FetchBaseQueryError (erro de rede/HTTP)
    const fetchError = error as FetchBaseQueryError;
    if (fetchError && "status" in fetchError) {
      const status = fetchError.status;
      if (status === 409 || status === 400) return true;

      // Se tiver dados, verifica a mensagem
      const data = fetchError.data as { error?: string } | undefined;
      const message = data?.error ?? "";
      if (
        message.toLowerCase().includes("finalizada") ||
        message.toLowerCase().includes("abandonada")
      ) {
        return true;
      }
    }

    // Trata SerializedError (erro inesperado, ex.: exceção na query)
    const serializedError = error as { message?: string };
    if (serializedError?.message) {
      const msg = serializedError.message.toLowerCase();
      if (msg.includes("finalizada") || msg.includes("abandonada")) return true;
    }

    return false;
  }

  useEffect(() => {
    if (progressError && isSessionExpiredError(progressError)) {
      toast.error("Sessão expirada ou já finalizada.");
      localStorage.removeItem(`survey-token-${slug}`);
      localStorage.removeItem(`survey-${slug}-answers`);
      navigate(`/s/${slug}`);
    }
  }, [progressError, slug, navigate]);

  if (!survey || !token)
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white p-4 rounded-lg shadow-sm space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        ))}
      </div>
    );

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
      // Limpa localStorage após envio bem-sucedido
      localStorage.removeItem(`survey-${slug}-answers`);
      navigate(`/s/${slug}/demographics`);
    } catch (err) {
      if (isSessionExpiredError(err)) {
        toast.error("Sessão expirada ou já finalizada.");
        localStorage.removeItem(`survey-token-${slug}`);
        localStorage.removeItem(`survey-${slug}-answers`);
        navigate(`/s/${slug}`);
      } else {
        toast.error("Erro ao enviar respostas. Verifique sua conexão.");
      }
    }
  };

  const isLast = currentIndex === questions.length - 1;
  const progressPercent = ((currentIndex + 1) / questions.length) * 100;

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
                  checked={
                    Array.isArray(currentAnswer) && currentAnswer.includes(opt)
                  }
                  onChange={(e) => handleAnswerChange([e.target.value])}
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

      <div className="flex-1 p-4">
        <h2 className="text-xl font-medium mb-4">
          {currentQuestion.text}
          {currentQuestion.required && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </h2>
        {renderQuestionInput()}
      </div>

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
