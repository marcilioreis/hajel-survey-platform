import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  useCreateSurveyMutation,
  useUpdateSurveyMutation,
  useAddQuestionsBatchMutation,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
} from "./surveysApi";
import type {
  BackendQuestion,
  BackendSurvey,
  CreateQuestionPayload,
  Question,
  QuestionOption,
  SurveyPayload,
  SurveyLocationItem,
} from "./surveys.types";

// ----------------------------------------------------------------------
// Mapeamento de tipos entre backend e frontend
// ----------------------------------------------------------------------
const mapBackendTypeToFrontend = (backendType: string): Question["type"] => {
  const mapping: Record<string, Question["type"]> = {
    unica_escolha: "unica_escolha",
    multipla_escolha: "multipla_escolha",
    texto_longo: "texto_longo",
  };
  return mapping[backendType] || "texto_longo";
};

const mapFrontendTypeToBackend = (
  frontendType: Question["type"],
): CreateQuestionPayload["type"] => {
  const mapping: Record<Question["type"], CreateQuestionPayload["type"]> = {
    unica_escolha: "unica_escolha",
    multipla_escolha: "multipla_escolha",
    texto_longo: "texto_longo",
  };
  return mapping[frontendType];
};

// ----------------------------------------------------------------------
// Normalizadores
// ----------------------------------------------------------------------
const normalizeQuestions = (
  backendQuestions: BackendQuestion[],
): Question[] => {
  return backendQuestions.map((q) => ({
    id: q.id,
    text: q.text,
    type: mapBackendTypeToFrontend(q.type),
    required: q.required,
    options: q.options.map((optText) => ({ text: optText })),
    order: q.order,
  }));
};

// ----------------------------------------------------------------------
// Componente QuestionEditor (interno)
// ----------------------------------------------------------------------
function QuestionEditor({
  question,
  onChange,
  onRemove,
}: {
  question: Question;
  onChange: (updated: Question) => void;
  onRemove: () => void;
}) {
  const showOptions = question.type !== "texto_longo";

  const addOption = () => {
    const newOption: QuestionOption = { text: "" };
    onChange({ ...question, options: [...question.options, newOption] });
  };

  const updateOption = (index: number, text: string) => {
    const updatedOptions = [...question.options];
    updatedOptions[index] = { ...updatedOptions[index], text };
    onChange({ ...question, options: updatedOptions });
  };

  const removeOption = (index: number) => {
    const updatedOptions = question.options.filter((_, i) => i !== index);
    onChange({ ...question, options: updatedOptions });
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex justify-between">
        <input
          type="text"
          value={question.text}
          onChange={(e) => onChange({ ...question, text: e.target.value })}
          placeholder="Pergunta"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-base"
        />
        <button
          type="button"
          onClick={onRemove}
          className="ml-2 p-2 text-red-600 hover:bg-red-50 rounded"
          title="Remover pergunta"
        >
          🗑️
        </button>
      </div>

      <div className="flex gap-4">
        <select
          value={question.type}
          onChange={(e) => {
            const newType = e.target.value as Question["type"];
            const newQuestion: Question = {
              ...question,
              type: newType,
              options: newType === "texto_longo" ? [] : question.options,
            };
            onChange(newQuestion);
          }}
          className="px-3 py-2 border border-gray-300 rounded-md text-base"
        >
          <option value="texto_longo">Texto longo</option>
          <option value="unica_escolha">Única escolha</option>
          <option value="multipla_escolha">Múltipla escolha</option>
        </select>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={question.required}
            onChange={(e) =>
              onChange({ ...question, required: e.target.checked })
            }
          />
          <span className="text-sm">Obrigatória</span>
        </label>
      </div>

      {showOptions && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Opções</label>
          {question.options.map((opt, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                type="text"
                value={opt.text}
                onChange={(e) => updateOption(idx, e.target.value)}
                placeholder={`Opção ${idx + 1}`}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-base"
              />
              <button
                type="button"
                onClick={() => removeOption(idx)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addOption}
            className="text-blue-600 text-sm font-medium"
          >
            + Adicionar opção
          </button>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// Componente Principal SurveyForm
// ----------------------------------------------------------------------
interface SurveyFormProps {
  initialSurvey?: BackendSurvey;
}

export default function SurveyForm({ initialSurvey }: SurveyFormProps) {
  const navigate = useNavigate();
  const isEditing = Boolean(initialSurvey);
  const surveyId = initialSurvey?.id;

  const [createSurvey, { isLoading: isCreating }] = useCreateSurveyMutation();
  const [updateSurvey, { isLoading: isUpdating }] = useUpdateSurveyMutation();
  const [addQuestionsBatch] = useAddQuestionsBatchMutation();
  const [updateQuestion] = useUpdateQuestionMutation();
  const [deleteQuestion] = useDeleteQuestionMutation();

  const [title, setTitle] = useState(() => initialSurvey?.title ?? "");
  const [description, setDescription] = useState(
    () => initialSurvey?.description ?? "",
  );
  const [endDate, setEndDate] = useState(() =>
    initialSurvey?.end_date ? initialSurvey.end_date.slice(0, 16) : "",
  );
  const [isPublic, setIsPublic] = useState(() => initialSurvey?.public ?? true);
  const [isActive, setIsActive] = useState(() => initialSurvey?.active ?? true);
  const [locations, setLocations] = useState<SurveyLocationItem[]>(() =>
    initialSurvey?.locations
      ? initialSurvey.locations.map((l, idx) => ({
          name: l.name,
          order: idx + 1,
        }))
      : [],
  );
  const [questions, setQuestions] = useState<Question[]>(() =>
    initialSurvey ? normalizeQuestions(initialSurvey.questions) : [],
  );

  const addNewQuestion = () => {
    const newQuestion: Question = {
      text: "",
      type: "texto_longo",
      required: false,
      options: [],
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestionHandler = (index: number, updated: Question) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = updated;
    setQuestions(updatedQuestions);
  };

  const removeQuestionHandler = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const addLocation = () => {
    setLocations([...locations, { name: "", order: locations.length + 1 }]);
  };

  const updateLocation = (
    index: number,
    field: "name" | "order",
    value: string | number,
  ) => {
    const updated = [...locations];
    updated[index] = { ...updated[index], [field]: value };
    setLocations(updated);
  };

  const removeLocation = (index: number) => {
    setLocations(locations.filter((_, i) => i !== index));
  };

  const syncQuestions = async (
    surveyId: number,
    originalQuestions: BackendQuestion[],
  ) => {
    const currentQuestions = questions;
    const originalMap = new Map(originalQuestions.map((q) => [q.id, q]));
    const removedQuestions = originalQuestions.filter(
      (orig) => !currentQuestions.some((curr) => curr.id === orig.id),
    );
    const newQuestions = currentQuestions.filter(
      (q) => !q.id || typeof q.id !== "number" || !originalMap.has(q.id),
    );
    const existingQuestions = currentQuestions.filter(
      (q) => q.id && typeof q.id === "number" && originalMap.has(q.id),
    );

    const operations: Promise<unknown>[] = [];

    if (newQuestions.length > 0) {
      const batchPayload = newQuestions.map((q, idx) => ({
        text: q.text.trim(),
        type: mapFrontendTypeToBackend(q.type),
        required: q.required,
        options: q.options.map((opt) => opt.text.trim()),
        order: q.order ?? idx + 1,
      }));
      operations.push(
        addQuestionsBatch({ surveyId, body: batchPayload }).unwrap(),
      );
    }

    for (const q of existingQuestions) {
      const original = originalMap.get(q.id!)!;
      const payload = {
        text: q.text.trim(),
        type: mapFrontendTypeToBackend(q.type),
        required: q.required,
        options: q.options.map((opt) => opt.text.trim()),
        order:
          q.order ?? currentQuestions.findIndex((curr) => curr.id === q.id) + 1,
      };
      const hasChanged =
        original.text !== payload.text ||
        original.type !== payload.type ||
        original.required !== payload.required ||
        JSON.stringify(original.options) !== JSON.stringify(payload.options) ||
        original.order !== payload.order;
      if (hasChanged) {
        operations.push(
          updateQuestion({
            surveyId,
            questionId: q.id!,
            body: payload,
          }).unwrap(),
        );
      }
    }

    for (const q of removedQuestions) {
      operations.push(deleteQuestion({ surveyId, questionId: q.id }).unwrap());
    }

    await Promise.all(operations);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || questions.length === 0) {
      toast.error("Preencha o título e adicione pelo menos uma pergunta.");
      return;
    }
    if (!endDate) {
      toast.error("Informe a data de término da pesquisa.");
      return;
    }

    const surveyPayload: SurveyPayload = {
      title: title.trim(),
      description: description.trim() || null,
      public: isPublic,
      active: isActive,
      endDate: new Date(endDate).toISOString(),
      locations: locations
        .filter((l) => l.name.trim() !== "")
        .map((l, idx) => ({
          name: l.name.trim(),
          order: l.order || idx + 1,
        })),
    };

    try {
      let currentSurveyId: number;
      if (isEditing) {
        const hasBasicChanges =
          initialSurvey!.title !== title.trim() ||
          (initialSurvey!.description || "") !== description.trim() ||
          initialSurvey!.public !== isPublic ||
          initialSurvey!.active !== isActive ||
          (initialSurvey!.end_date?.slice(0, 16) ?? "") !== endDate ||
          JSON.stringify(
            initialSurvey!.locations?.map((l) => ({
              name: l.name,
              order: (initialSurvey!.locations?.indexOf(l) ?? 0) + 1,
            })),
          ) !== JSON.stringify(surveyPayload.locations);

        if (hasBasicChanges) {
          await updateSurvey({ id: surveyId!, body: surveyPayload }).unwrap();
        }
        currentSurveyId = surveyId!;
      } else {
        const newSurvey = await createSurvey(surveyPayload).unwrap();
        currentSurveyId = newSurvey.id;
      }

      await syncQuestions(currentSurveyId, initialSurvey?.questions || []);
      toast.success(isEditing ? "Pesquisa atualizada!" : "Pesquisa criada!");
      navigate("/surveys");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar. Verifique os dados.");
    }
  };

  const isLoading = isCreating || isUpdating;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-20">
      <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
        <input
          type="text"
          placeholder="Título da pesquisa"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-base font-medium"
        />
        <textarea
          placeholder="Descrição (opcional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-base"
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data de término
          </label>
          <input
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-base"
          />
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
          <span className="text-sm">Pesquisa pública</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <span className="text-sm">Pesquisa ativa</span>
        </label>

        {/* Editor de locais */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Locais de coleta
          </label>
          {locations.map((loc, idx) => (
            <div key={idx} className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Nome do local"
                value={loc.name}
                onChange={(e) => updateLocation(idx, "name", e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-base"
              />
              <input
                type="number"
                placeholder="Ordem"
                value={loc.order}
                onChange={(e) =>
                  updateLocation(idx, "order", Number(e.target.value))
                }
                className="w-20 px-3 py-2 border border-gray-300 rounded-md text-base"
              />
              <button
                type="button"
                onClick={() => removeLocation(idx)}
                className="p-2 text-red-600"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addLocation}
            className="text-blue-600 text-sm font-medium"
          >
            + Adicionar local
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {questions.map((q, idx) => (
          <QuestionEditor
            key={q.id != null ? String(q.id) : `new-${idx}`}
            question={q}
            onChange={(updated) => updateQuestionHandler(idx, updated)}
            onRemove={() => removeQuestionHandler(idx)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={addNewQuestion}
        className="w-full py-3 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50"
      >
        + Adicionar Pergunta
      </button>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => navigate("/surveys")}
          className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
        >
          {isLoading ? "Salvando..." : "Salvar Pesquisa"}
        </button>
      </div>
    </form>
  );
}
