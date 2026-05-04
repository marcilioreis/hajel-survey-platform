import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import {
  useCreateSurveyMutation,
  useUpdateSurveyMutation,
  useAddQuestionsBatchMutation,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
  useGetLocationsQuery,
} from "./surveysApi";
import type {
  BackendQuestion,
  BackendSurvey,
  ConditionalLogic,
  CreateQuestionPayload,
  Question,
  QuestionOption,
  SurveyPayload,
} from "./surveys.types";
import DateTimePicker from "../../components/common/DateTimePicker";

// ----------------------------------------------------------------------
// Mapeamento e normalizadores
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

// Tipo auxiliar para perguntas brutas (vindas do backend)
interface RawQuestion {
  id: number;
  text: string;
  type: string;
  required: boolean;
  order: number;
  options: (string | QuestionOption)[];
  conditional_logic?: ConditionalLogic | null;
  conditionalLogic?: ConditionalLogic | null; // camelCase
}

const normalizeQuestions = (rawQuestions: RawQuestion[]): Question[] => {
  return rawQuestions.map((q) => ({
    id: q.id,
    text: q.text,
    type: mapBackendTypeToFrontend(q.type),
    required: q.required,
    options: q.options.map((opt) =>
      typeof opt === "string" ? { text: opt } : opt,
    ),
    order: q.order,
    conditional_logic: q.conditional_logic ?? q.conditionalLogic ?? null,
  }));
};

const denormalizeQuestion = (q: Question): CreateQuestionPayload => ({
  text: q.text.trim(),
  type: mapFrontendTypeToBackend(q.type),
  required: q.required,
  options: q.options.map((opt) => opt.text.trim()),
  order: q.order ?? 0,
  ...(q.conditional_logic && { conditional_logic: q.conditional_logic }),
});

// ----------------------------------------------------------------------
// QuestionEditor
// ----------------------------------------------------------------------
function QuestionEditor({
  question,
  onChange,
  onRemove,
  allQuestions,
}: {
  question: Question;
  onChange: (updated: Question) => void;
  onRemove: () => void;
  allQuestions: Question[];
}) {
  const showOptions = question.type !== "texto_longo";
  const [logicOpen, setLogicOpen] = useState(!!question.conditional_logic);

  const logic = question.conditional_logic;
  const triggerQuestionId = logic?.conditions[0]?.questionId ?? 0;
  const operator = logic?.conditions[0]?.operator ?? "equals";
  const rawValue = logic?.conditions[0]?.value ?? "";
  const triggerQuestion = allQuestions.find((q) => q.id === triggerQuestionId);

  const updateLogic = (newLogic: ConditionalLogic | null) => {
    onChange({ ...question, conditional_logic: newLogic });
  };

  const validOperators: ConditionalLogic["conditions"][0]["operator"][] = [
    "equals",
    "not_equals",
    "contains",
    "not_contains",
  ];

  const handleOperatorChange = (op: string) => {
    if (!logic) return;
    const newOperator = validOperators.find((o) => o === op);
    if (!newOperator) return;
    const newCondition = { ...logic.conditions[0], operator: newOperator };
    updateLogic({ ...logic, conditions: [newCondition] });
  };

  const handleTriggerChange = (qId: number) => {
    if (!qId) {
      updateLogic(null);
      setLogicOpen(false);
      return;
    }
    const newCondition: ConditionalLogic["conditions"][0] = {
      questionId: qId,
      operator: "equals",
      value: "",
    };
    updateLogic({
      action: logic?.action ?? "show",
      conditions: [newCondition],
    });
  };

  const handleActionChange = (action: ConditionalLogic["action"]) => {
    if (!logic) return;
    updateLogic({ ...logic, action });
  };

  const handleValueChange = (val: string | string[]) => {
    if (!logic) return;
    const newCondition = { ...logic.conditions[0], value: val };
    updateLogic({ ...logic, conditions: [newCondition] });
  };

  const removeLogic = () => {
    updateLogic(null);
    setLogicOpen(false);
  };

  const renderValueInput = () => {
    if (!triggerQuestion) return null;

    if (triggerQuestion.type === "multipla_escolha") {
      const selectedValues = Array.isArray(rawValue)
        ? rawValue
        : typeof rawValue === "string" && rawValue.length > 0
          ? [rawValue]
          : [];

      const toggleValue = (opt: string) => {
        const newValues = selectedValues.includes(opt)
          ? selectedValues.filter((v) => v !== opt)
          : [...selectedValues, opt];
        handleValueChange(newValues);
      };
      return (
        <div className="space-y-1">
          {triggerQuestion.options.map((opt) => (
            <label key={opt.text} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedValues.includes(opt.text)}
                onChange={() => toggleValue(opt.text)}
              />
              {opt.text}
            </label>
          ))}
        </div>
      );
    }

    if (triggerQuestion.type === "unica_escolha") {
      const normalizedValue = Array.isArray(rawValue)
        ? (rawValue[0] ?? "")
        : rawValue;
      return (
        <div className="space-y-1">
          {triggerQuestion.options.map((opt) => (
            <label key={opt.text} className="flex items-center gap-2">
              <input
                type="radio"
                name={`trigger-val-${question.id}`}
                value={opt.text}
                checked={normalizedValue === opt.text}
                onChange={() => handleValueChange(opt.text)}
              />
              {opt.text}
            </label>
          ))}
        </div>
      );
    }

    return (
      <input
        type="text"
        value={typeof rawValue === "string" ? rawValue : ""}
        onChange={(e) => handleValueChange(e.target.value)}
        placeholder="Valor esperado"
        className="w-full p-2 border rounded"
      />
    );
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
                onChange={(e) => {
                  const updatedOptions = [...question.options];
                  updatedOptions[idx] = {
                    ...updatedOptions[idx],
                    text: e.target.value,
                  };
                  onChange({ ...question, options: updatedOptions });
                }}
                placeholder={`Opção ${idx + 1}`}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-base"
              />
              <button
                type="button"
                onClick={() => {
                  const updatedOptions = question.options.filter(
                    (_, i) => i !== idx,
                  );
                  onChange({ ...question, options: updatedOptions });
                }}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              const newOption: QuestionOption = { text: "" };
              onChange({
                ...question,
                options: [...question.options, newOption],
              });
            }}
            className="text-blue-600 text-sm font-medium"
          >
            + Adicionar opção
          </button>
        </div>
      )}

      <div className="border-t pt-2 mt-2">
        {!logicOpen ? (
          <button
            type="button"
            onClick={() => setLogicOpen(true)}
            className="text-sm text-gray-500 hover:text-blue-600"
          >
            + Adicionar lógica condicional
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Lógica condicional
              </span>
              <button
                type="button"
                onClick={removeLogic}
                className="text-red-600 text-sm"
              >
                Remover
              </button>
            </div>

            <div>
              <label className="text-xs text-gray-500">Ação</label>
              <select
                value={logic?.action ?? "show"}
                onChange={(e) =>
                  handleActionChange(
                    e.target.value as ConditionalLogic["action"],
                  )
                }
                className="w-full p-2 border rounded text-sm"
              >
                <option value="show">Mostrar esta pergunta</option>
                <option value="skip">Pular esta pergunta</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-500">Pergunta gatilho</label>
              <select
                value={triggerQuestionId}
                onChange={(e) => handleTriggerChange(Number(e.target.value))}
                className="w-full p-2 border rounded text-sm"
              >
                <option value="">Selecione uma pergunta</option>
                {allQuestions
                  .filter((q) => q.id !== question.id)
                  .map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.text || `Pergunta ${q.order ?? q.id}`}
                    </option>
                  ))}
              </select>
            </div>

            {triggerQuestion && (
              <>
                <div>
                  <label className="text-xs text-gray-500">Operador</label>
                  <select
                    value={operator}
                    onChange={(e) => handleOperatorChange(e.target.value)}
                    className="w-full p-2 border rounded text-sm"
                  >
                    <option value="equals">Igual a</option>
                    <option value="not_equals">Diferente de</option>
                    {triggerQuestion.type !== "texto_longo" && (
                      <>
                        <option value="contains">Contém</option>
                        <option value="not_contains">Não contém</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-500">
                    {triggerQuestion.type === "multipla_escolha"
                      ? "Valores (selecione um ou mais)"
                      : "Valor"}
                  </label>
                  {renderValueInput()}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Componente Principal SurveyForm
// ----------------------------------------------------------------------
export default function SurveyForm({
  initialSurvey,
}: {
  initialSurvey?: BackendSurvey;
}) {
  const navigate = useNavigate();
  const isEditing = Boolean(initialSurvey);
  const surveyId = initialSurvey?.id;

  const { data: allLocations = [] } = useGetLocationsQuery();
  const [createSurvey, { isLoading: isCreating }] = useCreateSurveyMutation();
  const [updateSurvey, { isLoading: isUpdating }] = useUpdateSurveyMutation();
  const [addQuestionsBatch] = useAddQuestionsBatchMutation();
  const [updateQuestion] = useUpdateQuestionMutation();
  const [deleteQuestion] = useDeleteQuestionMutation();

  const [title, setTitle] = useState(() => initialSurvey?.title ?? "");
  const [description, setDescription] = useState(
    () => initialSurvey?.description ?? "",
  );
  const [startDate, setStartDate] = useState<string>(() =>
    initialSurvey?.start_date ? initialSurvey.start_date.slice(0, 16) : "",
  );
  const [endDate, setEndDate] = useState<string>(() =>
    initialSurvey?.end_date ? initialSurvey.end_date.slice(0, 16) : "",
  );
  const [isPublic, setIsPublic] = useState(() => initialSurvey?.public ?? true);
  const [isActive, setIsActive] = useState(() => initialSurvey?.active ?? true);
  const [selectedLocations, setSelectedLocations] = useState<
    { id: number; order: number }[]
  >(() => {
    if (initialSurvey?.locations) {
      return initialSurvey.locations.map((l, idx) => ({
        id: l.id,
        order: idx + 1,
      }));
    }
    return [];
  });
  const [questions, setQuestions] = useState<Question[]>(() =>
    initialSurvey
      ? normalizeQuestions(initialSurvey.questions as RawQuestion[])
      : [],
  );

  const toggleLocation = (locationId: number) => {
    setSelectedLocations((prev) => {
      const exists = prev.find((l) => l.id === locationId);
      if (exists) return prev.filter((l) => l.id !== locationId);
      const maxOrder = prev.reduce((max, l) => Math.max(max, l.order), 0);
      return [...prev, { id: locationId, order: maxOrder + 1 }];
    });
  };
  const updateSelectedOrder = (locationId: number, order: number) => {
    setSelectedLocations((prev) =>
      prev.map((l) => (l.id === locationId ? { ...l, order } : l)),
    );
  };

  const addNewQuestion = () => {
    const newQuestion: Question = {
      id: -Date.now(),
      text: "",
      type: "texto_longo",
      required: false,
      options: [],
      conditional_logic: null,
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
        ...denormalizeQuestion(q),
        order: q.order ?? idx + 1,
      }));
      operations.push(
        addQuestionsBatch({ surveyId, body: batchPayload }).unwrap(),
      );
    }

    for (const q of existingQuestions) {
      const original = originalMap.get(q.id!)!;
      const payload = {
        ...denormalizeQuestion(q),
        order:
          q.order ?? currentQuestions.findIndex((curr) => curr.id === q.id) + 1,
      };
      const hasChanged =
        original.text !== payload.text ||
        original.type !== payload.type ||
        original.required !== payload.required ||
        JSON.stringify(original.options) !== JSON.stringify(payload.options) ||
        original.order !== payload.order ||
        JSON.stringify(original.conditional_logic) !==
          JSON.stringify(q.conditional_logic);
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
      startDate: startDate ? `${startDate}` : undefined,
      endDate: `${endDate}`,
      locations: selectedLocations.map((l) => ({ id: l.id, order: l.order })),
    };

    try {
      let currentSurveyId: number;
      if (isEditing) {
        const hasBasicChanges =
          initialSurvey!.title !== title.trim() ||
          (initialSurvey!.description || "") !== description.trim() ||
          initialSurvey!.public !== isPublic ||
          initialSurvey!.active !== isActive ||
          (initialSurvey!.start_date?.slice(0, 16) ?? "") !== startDate ||
          (initialSurvey!.end_date?.slice(0, 16) ?? "") !== endDate ||
          JSON.stringify(
            initialSurvey!.locations?.map((l, idx) => ({
              id: l.id,
              order: idx + 1,
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
        <div className="flex gap-2">
          <label className="hidden items-center gap-2 ">
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
        </div>
        <div className="flex gap-8">
          <div className="w-1/2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Período da pesquisa *
            </label>
            <DateTimePicker
              startValue={startDate}
              endValue={endDate}
              onStartChange={setStartDate}
              onEndChange={setEndDate}
              required
              minDate={new Date()}
            />
          </div>
          <div className="w-1/2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Locais de coleta *
            </label>
            {allLocations.length === 0 ? (
              <p className="text-sm text-gray-500">
                Nenhum local cadastrado.{" "}
                <Link to="/locations/new" className="text-blue-600">
                  Cadastrar agora
                </Link>
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-2">
                {allLocations.map((loc) => {
                  const selected = selectedLocations.find(
                    (l) => l.id === loc.id,
                  );
                  return (
                    <div key={loc.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!selected}
                        onChange={() => toggleLocation(loc.id)}
                        className="rounded w-8"
                      />
                      <span className="flex-1 text-left text-sm">
                        {loc.name}
                      </span>
                      {selected ? (
                        <input
                          type="number"
                          min="1"
                          value={selected.order}
                          onChange={(e) =>
                            updateSelectedOrder(loc.id, Number(e.target.value))
                          }
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="Ordem"
                          title="Ordem de exibição"
                        />
                      ) : (
                        <div className="w-16 px-2 py-1">
                          <span className="hidden"></span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <Link
              to="/locations/new"
              className="text-blue-600 text-sm mt-1 inline-block"
            >
              + Cadastrar novo local
            </Link>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {questions.map((q, idx) => (
          <QuestionEditor
            key={q.id != null ? String(q.id) : `new-${idx}`}
            question={q}
            onChange={(updated) => updateQuestionHandler(idx, updated)}
            onRemove={() => removeQuestionHandler(idx)}
            allQuestions={questions}
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
