import { useState } from "react";
import type {
  Question,
  ConditionalLogic,
  QuestionOption,
} from "./surveys.types";

export function QuestionEditor({
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
          <option value="texto_longo">Espontânea</option>
          <option value="unica_escolha">Induzida</option>
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
