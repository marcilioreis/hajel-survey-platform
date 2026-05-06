import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  useGetSurveyByIdQuery,
  useSubmitResponsesMutation,
} from "./surveysApi";
import { useConditionalLogic } from "../surveys/useConditionalLogic";
import type { DemographicData, AnswersMap } from "./surveys.types";
import Skeleton from "../../components/common/Skeleton";
import { normalizeQuestions } from "../../utils/normalizers";
import { getOptionText } from "../../utils/text";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  const [step, setStep] = useState<"demographics" | "questions">(
    "demographics",
  );
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

  const normalizedQuestions = normalizeQuestions(survey?.questions ?? []);
  const visibleQuestions = useConditionalLogic(normalizedQuestions, answers);

  useEffect(() => {
    if (id && Object.keys(answers).length > 0) {
      localStorage.setItem(`survey-${id}-answers`, JSON.stringify(answers));
    }
  }, [answers, id]);

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="p-4 text-center text-red-600">
        Pesquisa não encontrada.
      </div>
    );
  }

  const currentQuestion = visibleQuestions[currentIndex] ?? null;
  const currentAnswer = currentQuestion
    ? (answers[currentQuestion.id!] ?? undefined)
    : undefined;

  const handleAnswerChange = (value: string | string[]) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id!]: value }));
  };

  const handleNext = () => {
    if (currentIndex < visibleQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleFinishQuestions = () => {
    const unansweredRequired = visibleQuestions.filter(
      (q) => q.required && !answers[q.id!],
    );
    if (unansweredRequired.length > 0) {
      toast.error(
        `Há ${unansweredRequired.length} pergunta(s) obrigatória(s) sem resposta.`,
      );
      const firstUnanswered = visibleQuestions.findIndex(
        (q) => q.required && !answers[q.id!],
      );
      if (firstUnanswered !== -1) setCurrentIndex(firstUnanswered);
      return;
    }
    handleComplete();
  };

  const handleDemographicsChange = (
    field: keyof DemographicData,
    value: string,
  ) => {
    setDemographics((prev) => ({ ...prev, [field]: value }));
  };

  const triggerVibration = () => {
    if ("vibrate" in navigator) {
      navigator.vibrate([30, 50, 30]);
    }
  };

  const handleAdvanceToQuestions = () => {
    if (Object.values(demographics).some((v) => !v)) {
      toast.error("Preencha todos os campos demográficos antes de continuar.");
      return;
    }
    setStep("questions");
  };

  const handleComplete = async () => {
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

  const renderQuestionInput = () => {
    if (!currentQuestion) return null;
    const q = currentQuestion;

    switch (q.type) {
      case "texto_longo":
        return (
          <Input
            id={`answer-text-${q.id}`}
            data-testid={`answer-text-${q.id}`}
            value={(currentAnswer as string) || ""}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="Digite sua resposta..."
          />
        );

      case "unica_escolha":
        return (
          <div className="space-y-3">
            {q.options.map((opt, idx) => {
              const optionText = getOptionText(opt);
              return (
                <label
                  key={idx}
                  className="flex items-center gap-3 p-3 border rounded-lg"
                >
                  <input
                    type="radio"
                    id={`answer-radio-${q.id}-${idx}`}
                    name={`answer-${q.id}`}
                    data-testid={`answer-radio-${q.id}-${idx}`}
                    value={optionText}
                    checked={
                      Array.isArray(currentAnswer) &&
                      currentAnswer.includes(optionText)
                    }
                    onChange={(e) => handleAnswerChange([e.target.value])}
                    className="w-5 h-5 text-blue-600"
                  />
                  <span className="text-base">{optionText}</span>
                </label>
              );
            })}
          </div>
        );

      case "multipla_escolha":
        return (
          <div className="space-y-3">
            {q.options.map((opt, idx) => {
              const optionText = getOptionText(opt);
              const isChecked =
                Array.isArray(currentAnswer) &&
                currentAnswer.includes(optionText);
              return (
                <label
                  key={idx}
                  className="flex items-center gap-3 p-3 border rounded-lg"
                >
                  <input
                    type="checkbox"
                    id={`answer-check-${q.id}-${idx}`}
                    name={`answer-${q.id}-${idx}`}
                    data-testid={`answer-check-${q.id}-${idx}`}
                    value={optionText}
                    checked={isChecked}
                    onChange={(e) => {
                      const arr = Array.isArray(currentAnswer)
                        ? [...currentAnswer]
                        : [];
                      if (e.target.checked) {
                        arr.push(optionText);
                      } else {
                        const index = arr.indexOf(optionText);
                        if (index > -1) arr.splice(index, 1);
                      }
                      handleAnswerChange(arr);
                    }}
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                  <span className="text-base">{optionText}</span>
                </label>
              );
            })}
          </div>
        );

      default:
        return <div>Tipo de pergunta não suportado.</div>;
    }
  };

  // Etapa DEMOGRAPHICS
  if (step === "demographics") {
    const locations = survey.locations || [];
    return (
      <div className="max-w-md mx-auto p-4 space-y-6">
        <h2 className="text-2xl font-bold">Dados do Respondente</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="demographics-age">Faixa etária</Label>
            <Select
              value={demographics.ageRange}
              onValueChange={(value) =>
                handleDemographicsChange("ageRange", value)
              }
            >
              <SelectTrigger id="demographics-age">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="16-24">16-24 anos</SelectItem>
                <SelectItem value="25-34">25-34 anos</SelectItem>
                <SelectItem value="35-44">35-44 anos</SelectItem>
                <SelectItem value="45-54">45-54 anos</SelectItem>
                <SelectItem value="55-65">55-65 anos</SelectItem>
                <SelectItem value="65+">65+ anos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="demographics-gender">Gênero</Label>
            <Select
              value={demographics.gender}
              onValueChange={(value) =>
                handleDemographicsChange("gender", value)
              }
            >
              <SelectTrigger id="demographics-gender">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">Masculino</SelectItem>
                <SelectItem value="F">Feminino</SelectItem>
                <SelectItem value="NB">Não-binário</SelectItem>
                <SelectItem value="O">Outro</SelectItem>
                <SelectItem value="PNR">Prefiro não responder</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="demographics-income">Renda familiar</Label>
            <Select
              value={demographics.incomeRange}
              onValueChange={(value) =>
                handleDemographicsChange("incomeRange", value)
              }
            >
              <SelectTrigger id="demographics-income">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="<1 SM">Menos de 1 SM</SelectItem>
                <SelectItem value="1-2 SM">1 a 2 SM</SelectItem>
                <SelectItem value="2-3 SM">2 a 3 SM</SelectItem>
                <SelectItem value="3-4 SM">3 a 4 SM</SelectItem>
                <SelectItem value=">4 SM">Mais de 4 SM</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="demographics-education">Escolaridade</Label>
            <Select
              value={demographics.education}
              onValueChange={(value) =>
                handleDemographicsChange("education", value)
              }
            >
              <SelectTrigger id="demographics-education">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NA">Não alfabetizado</SelectItem>
                <SelectItem value="ENSINO_FUNDAMENTAL">
                  Ensino Fundamental
                </SelectItem>
                <SelectItem value="ENSINO_MEDIO">Ensino Médio</SelectItem>
                <SelectItem value="ENSINO_SUPERIOR">Ensino Superior</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="demographics-occupation">Ocupação</Label>
            <Input
              id="demographics-occupation"
              data-testid="demographics-occupation"
              placeholder="Ocupação"
              value={demographics.occupation}
              onChange={(e) =>
                handleDemographicsChange("occupation", e.target.value)
              }
              required
            />
          </div>
          {locations.length > 0 && (
            <div>
              <Label htmlFor="demographics-location">Localização</Label>
              <Select
                value={demographics.locationId}
                onValueChange={(value) =>
                  handleDemographicsChange("locationId", value)
                }
              >
                <SelectTrigger id="demographics-location">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={String(loc.id)}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate("/surveys")}>
              Cancelar
            </Button>
            <Button onClick={handleAdvanceToQuestions}>
              Avançar para as perguntas
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Etapa QUESTIONS
  const isLast = currentIndex === visibleQuestions.length - 1;
  const progressPercent =
    visibleQuestions.length > 0
      ? ((currentIndex + 1) / visibleQuestions.length) * 100
      : 0;

  return (
    <div className="flex flex-col">
      <div className="bg-white p-4 shadow-sm">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>
            Pergunta {currentIndex + 1} de {visibleQuestions.length}
          </span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>
      <div className="flex-1 p-4 overflow-auto">
        <h2 className="text-xl font-medium mb-4">
          {currentQuestion.text}
          {currentQuestion.required && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </h2>
        {renderQuestionInput()}
      </div>
      <div className="bg-white p-4 border-t flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
        >
          Anterior
        </Button>
        {isLast ? (
          <Button onClick={handleFinishQuestions} disabled={isSubmitting}>
            {isSubmitting ? "Enviando..." : "Finalizar pesquisa"}
          </Button>
        ) : (
          <Button onClick={handleNext}>Próxima</Button>
        )}
      </div>
    </div>
  );
}
