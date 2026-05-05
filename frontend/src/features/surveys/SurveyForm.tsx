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
  CreateQuestionPayload,
  Question,
  SurveyPayload,
} from "./surveys.types";
import DateTimePicker from "../../components/common/DateTimePicker";
import { QuestionEditor } from "./QuestionEditor";
import { mapFrontendTypeToBackend } from "../../utils/mapping";
import { normalizeQuestions } from "../../utils/normalizers";

const denormalizeQuestion = (q: Question): CreateQuestionPayload => ({
  text: q.text.trim(),
  type: mapFrontendTypeToBackend(q.type),
  required: q.required,
  options: q.options.map((opt) => opt.text.trim()),
  order: q.order ?? 0,
  ...(q.conditional_logic && { conditional_logic: q.conditional_logic }),
});

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
    initialSurvey ? normalizeQuestions(initialSurvey.questions) : [],
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
    <form
      onSubmit={handleSubmit}
      className="space-y-4 pb-20"
      data-testid="survey-form"
    >
      <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
        <div>
          <label
            htmlFor="survey-title"
            className="block text-sm font-medium text-gray-700"
          >
            Título da pesquisa
          </label>
          <input
            id="survey-title"
            name="survey-title"
            data-testid="survey-title"
            type="text"
            placeholder="Título da pesquisa"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-base font-medium"
          />
        </div>
        <div>
          <label
            htmlFor="survey-description"
            className="block text-sm font-medium text-gray-700"
          >
            Descrição (opcional)
          </label>
          <textarea
            id="survey-description"
            name="survey-description"
            data-testid="survey-description"
            placeholder="Descrição (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-base"
          />
        </div>
        <div className="flex gap-2">
          <label className="flex items-center gap-2">
            <input
              id="survey-public"
              name="survey-public"
              data-testid="survey-public"
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            <span className="text-sm">Pesquisa pública</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              id="survey-active"
              name="survey-active"
              data-testid="survey-active"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <span className="text-sm">Pesquisa ativa</span>
          </label>
        </div>
        <div className="flex gap-8">
          <div className="w-1/2">
            <span className="block text-sm font-medium text-gray-700 mb-2">
              Período da pesquisa *
            </span>
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
            <span className="block text-sm font-medium text-gray-700 mb-2">
              Locais de coleta *
            </span>
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
                        id={`survey-location-${loc.id}`}
                        name={`survey-location-${loc.id}`}
                        data-testid={`survey-location-${loc.id}`}
                        checked={!!selected}
                        onChange={() => toggleLocation(loc.id)}
                        className="rounded w-8"
                      />
                      <label
                        htmlFor={`survey-location-${loc.id}`}
                        className="flex-1 text-left text-sm"
                      >
                        {loc.name}
                      </label>
                      {selected ? (
                        <input
                          type="number"
                          id={`survey-location-order-${loc.id}`}
                          name={`survey-location-order-${loc.id}`}
                          data-testid={`survey-location-order-${loc.id}`}
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
        data-testid="survey-add-question"
        className="w-full py-3 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50"
      >
        + Adicionar Pergunta
      </button>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => navigate("/surveys")}
          data-testid="survey-cancel"
          className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          data-testid="survey-submit"
          className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
        >
          {isLoading ? "Salvando..." : "Salvar Pesquisa"}
        </button>
      </div>
    </form>
  );
}
