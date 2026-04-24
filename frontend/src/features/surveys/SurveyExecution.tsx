import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  useGetSurveyByIdQuery,
  useSubmitResponsesMutation,
} from "./surveysApi";
import type { DemographicData } from "./surveys.types";
import Skeleton from "../../components/common/Skeleton";

type AnswersMap = Record<number, string | string[]>;

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

  const [step, setStep] = useState<"questions" | "demographics">("questions");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswersMap>(() =>
    id ? loadSavedAnswers(id) : {},
  );
  const [demographics, setDemographics] = useState<DemographicData>({
    ageRange: "",
    gender: "",
    incomeRange: "",
    education: "",
    occupation: "",
    locationId: "",
  });

  // Persistência local das respostas
  useEffect(() => {
    if (id && Object.keys(answers).length > 0) {
      localStorage.setItem(`survey-${id}-answers`, JSON.stringify(answers));
    }
  }, [answers, id]);

  if (isLoading)
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
  if (!survey)
    return (
      <div className="p-4 text-center text-red-600">
        Pesquisa não encontrada.
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

  const handleFinishQuestions = () => {
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
    setStep("demographics");
  };

  const handleDemographicsChange = (
    field: keyof DemographicData,
    value: string,
  ) => {
    setDemographics((prev) => ({ ...prev, [field]: value }));
  };

  const triggerVibration = () => {
    if ("vibrate" in navigator) {
      // Vibrate for 30ms, pause for 50ms, vibrate for 30ms
      navigator.vibrate([30, 50, 30]);
    } else {
      console.log("Vibration API not supported");
    }
  };

  const handleComplete = async () => {
    if (Object.values(demographics).some((v) => !v)) {
      toast.error("Preencha todos os campos demográficos.");
      return;
    }

    const payload = {
      surveyId: Number(id),
      answers: Object.entries(answers).map(([questionId, value]) => ({
        questionId: Number(questionId),
        value,
      })),
      respondent: {
        ...demographics,
        locationId: Number(demographics.locationId),
      },
    };

    try {
      await submitResponses(payload).unwrap();
      localStorage.removeItem(`survey-${id}-answers`);
      triggerVibration();
      toast.success("Pesquisa concluída com sucesso!");
      navigate("/surveys");
    } catch {
      toast.error("Erro ao finalizar pesquisa. Tente novamente.");
    }
  };

  // Renderização dos inputs conforme o tipo da pergunta
  const renderQuestionInput = () => {
    if (!currentQuestion) return null;
    const q = currentQuestion;

    switch (q.type) {
      case "texto_curto":
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

  if (step === "questions") {
    const isLast = currentIndex === questions.length - 1;
    const progressPercent = ((currentIndex + 1) / questions.length) * 100;

    return (
      <div className="bg-gray-50 flex flex-col">
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
              onClick={handleFinishQuestions}
              className="px-6 py-2 bg-green-600 text-white rounded-lg"
            >
              Concluir respostas
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

  // Etapa demográfica
  // Usamos um type assertion para acessar locations, pois pode não estar definido no tipo BackendSurvey
  const locations = survey.locations || [];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <form
        onSubmit={(e) => e.preventDefault()}
        className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-sm space-y-4"
      >
        <h2 className="text-xl font-bold mb-4">Dados do Respondente</h2>

        <select
          value={demographics.ageRange}
          onChange={(e) => handleDemographicsChange("ageRange", e.target.value)}
          required
          className="w-full p-3 border rounded-lg"
        >
          <option value="">Faixa etária</option>
          <option value="16-24">16-24 anos</option>
          <option value="25-34">25-34 anos</option>
          <option value="35-44">35-44 anos</option>
          <option value="45-54">45-54 anos</option>
          <option value="55-65">55-65 anos</option>
          <option value="65+">65+ anos</option>
        </select>

        <select
          value={demographics.gender}
          onChange={(e) => handleDemographicsChange("gender", e.target.value)}
          required
          className="w-full p-3 border rounded-lg"
        >
          <option value="">Gênero</option>
          <option value="M">Masculino</option>
          <option value="F">Feminino</option>
          <option value="NB">Não-binário</option>
          <option value="O">Outro</option>
          <option value="PNR">Prefiro não responder</option>
        </select>

        <select
          value={demographics.incomeRange}
          onChange={(e) =>
            handleDemographicsChange("incomeRange", e.target.value)
          }
          required
          className="w-full p-3 border rounded-lg"
        >
          <option value="">Renda familiar</option>
          <option value="<1 SM">Menos de 1 salário mínimo</option>
          <option value="1-2 SM">1 a 2 salários mínimos</option>
          <option value="2-3 SM">2 a 3 salários mínimos</option>
          <option value="3-4 SM">3 a 4 salários mínimos</option>
          <option value=">4 SM">Mais de 4 salários mínimos</option>
        </select>

        <input
          type="text"
          placeholder="Escolaridade"
          value={demographics.education}
          onChange={(e) =>
            handleDemographicsChange("education", e.target.value)
          }
          required
          className="w-full p-3 border rounded-lg"
        />
        <input
          type="text"
          placeholder="Ocupação"
          value={demographics.occupation}
          onChange={(e) =>
            handleDemographicsChange("occupation", e.target.value)
          }
          required
          className="w-full p-3 border rounded-lg"
        />

        {locations.length > 0 && (
          <select
            value={demographics.locationId}
            onChange={(e) =>
              handleDemographicsChange("locationId", e.target.value)
            }
            required
            className="w-full p-3 border rounded-lg"
          >
            <option value="">Localização</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => setStep("questions")}
            className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={handleComplete}
            disabled={isSubmitting}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
          >
            {isSubmitting ? "Finalizando..." : "Concluir Pesquisa"}
          </button>
        </div>
      </form>
    </div>
  );
}
