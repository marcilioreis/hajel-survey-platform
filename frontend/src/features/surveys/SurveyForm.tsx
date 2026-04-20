import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  useCreateSurveyMutation,
  useUpdateSurveyMutation,
  useGetSurveyByIdQuery,
} from "./surveysApi";
import type {
  BackendQuestion,
  CreateQuestionRequest,
  CreateSurveyRequest,
  Question,
  QuestionOption,
} from "./surveys.types";

// Mapeamento de tipos entre backend e frontend
const mapBackendTypeToFrontend = (backendType: string): Question["type"] => {
  const mapping: Record<string, Question["type"]> = {
    unica_escolha: "unica_escolha",
    multipla_escolha: "multipla_escolha",
    texto: "texto",
  };
  return mapping[backendType] || "texto";
};

const mapFrontendTypeToBackend = (frontendType: Question["type"]): string => {
  const mapping: Record<Question["type"], string> = {
    unica_escolha: "unica_escolha",
    multipla_escolha: "multipla_escolha",
    texto: "text",
  };
  return mapping[frontendType];
};

// Normaliza as perguntas vindas do backend para o formato usado no frontend
const normalizeQuestions = (
  backendQuestions: BackendQuestion[],
): Question[] => {
  return backendQuestions.map((q) => ({
    id: q.id,
    text: q.text,
    type: mapBackendTypeToFrontend(q.type),
    required: q.required,
    options: q.options.map((optText) => ({ text: optText })),
  }));
};

// Desnormaliza para enviar ao backend (converte options de volta para string[])
const denormalizeQuestions = (
  questions: Question[],
): CreateQuestionRequest[] => {
  return questions.map((q, idx) => ({
    text: q.text.trim(),
    type: mapFrontendTypeToBackend(q.type),
    required: q.required,
    options: q.options.map((opt) => opt.text.trim()),
    order: idx,
  }));
};

// Componente para editar uma pergunta
function QuestionEditor({
  question,
  onChange,
  onRemove,
}: {
  question: Question;
  onChange: (updated: Question) => void;
  onRemove: () => void;
}) {
  const [showOptions, setShowOptions] = useState(question.type !== "texto");

  const addOption = () => {
    const newOption: QuestionOption = { text: "" };
    onChange({
      ...question,
      options: [...question.options, newOption],
    });
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
              options: newType === "texto" ? [] : question.options,
            };
            onChange(newQuestion);
            setShowOptions(newType !== "texto");
          }}
          className="px-3 py-2 border border-gray-300 rounded-md text-base"
        >
          <option value="texto">Texto</option>
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
                onClick={() => removeOption(idx)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                ✕
              </button>
            </div>
          ))}
          <button
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

export default function SurveyForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const { data: existingSurvey, isLoading: isLoadingSurvey } =
    useGetSurveyByIdQuery(id!, {
      skip: !isEditing,
    });

  const [createSurvey, { isLoading: isCreating }] = useCreateSurveyMutation();
  const [updateSurvey, { isLoading: isUpdating }] = useUpdateSurveyMutation();

  // Inicialização direta dos estados (executada apenas na montagem)
  const [title, setTitle] = useState(existingSurvey?.title ?? "");
  const [description, setDescription] = useState(
    existingSurvey?.description ?? "",
  );
  const [questions, setQuestions] = useState<Question[]>(
    existingSurvey
      ? normalizeQuestions(existingSurvey.questions as BackendQuestion[])
      : [],
  );

  // Se estiver editando e os dados ainda estão carregando, exibe loading
  if (isEditing && isLoadingSurvey) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now(), // ID temporário
      text: "",
      type: "texto",
      required: false,
      options: [],
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, updated: Question) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = updated;
    setQuestions(updatedQuestions);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || questions.length === 0) {
      toast.error("Preencha o título e adicione pelo menos uma pergunta.");
      return;
    }

    const payload: CreateSurveyRequest = {
      title: title.trim(),
      description: description.trim() || undefined,
      questions: denormalizeQuestions(questions),
    };

    console.log("isEditing :>> ", isEditing);

    try {
      if (isEditing) {
        await updateSurvey({ id: id!, ...payload }).unwrap();
        console.log("payload :>> ", payload);
        toast.success("Pesquisa atualizada com sucesso!");
      } else {
        await createSurvey(payload as CreateSurveyRequest).unwrap();
        toast.success("Pesquisa criada com sucesso!");
      }
      navigate("/surveys");
    } catch (err) {
      console.error("Erro ao salvar pesquisa:", err);
      toast.error("Erro ao salvar pesquisa. Tente novamente.");
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
      </div>

      <div className="space-y-3">
        {questions.map((q, idx) => (
          <QuestionEditor
            key={q.id || idx}
            question={q}
            onChange={(updated) => updateQuestion(idx, updated)}
            onRemove={() => removeQuestion(idx)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={addQuestion}
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
