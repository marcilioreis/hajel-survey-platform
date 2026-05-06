import { useState } from "react";
import type {
  Question,
  ConditionalLogic,
  QuestionOption,
} from "./surveys.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Trash2, Plus } from "lucide-react";

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

  const handleTriggerChange = (qId: string) => {
    const numId = Number(qId);
    // Se numId for 0 ou NaN, trata como remoção da lógica
    if (!numId || isNaN(numId)) {
      updateLogic(null);
      setLogicOpen(false);
      return;
    }
    const newCondition: ConditionalLogic["conditions"][0] = {
      questionId: numId,
      operator: "equals",
      value: "",
    };
    updateLogic({
      action: logic?.action ?? "show",
      conditions: [newCondition],
    });
  };

  const handleActionChange = (action: string) => {
    if (!logic) return;
    updateLogic({ ...logic, action: action as ConditionalLogic["action"] });
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
        <div className="space-y-2">
          {triggerQuestion.options.map((opt) => (
            <div key={opt.text} className="flex items-center space-x-2">
              <Checkbox
                id={`logic-value-${question.id}-${opt.text}`}
                checked={selectedValues.includes(opt.text)}
                onCheckedChange={() => toggleValue(opt.text)}
              />
              <Label htmlFor={`logic-value-${question.id}-${opt.text}`}>
                {opt.text}
              </Label>
            </div>
          ))}
        </div>
      );
    }

    if (triggerQuestion.type === "unica_escolha") {
      const normalizedValue = Array.isArray(rawValue)
        ? (rawValue[0] ?? "")
        : rawValue;
      return (
        <RadioGroup value={normalizedValue} onValueChange={handleValueChange}>
          {triggerQuestion.options.map((opt) => (
            <div key={opt.text} className="flex items-center space-x-2">
              <RadioGroupItem
                value={opt.text}
                id={`logic-value-${question.id}-${opt.text}`}
              />
              <Label htmlFor={`logic-value-${question.id}-${opt.text}`}>
                {opt.text}
              </Label>
            </div>
          ))}
        </RadioGroup>
      );
    }

    return (
      <Input
        type="text"
        value={typeof rawValue === "string" ? rawValue : ""}
        onChange={(e) => handleValueChange(e.target.value)}
        placeholder="Valor esperado"
      />
    );
  };

  return (
    <div className="border rounded-lg p-4 space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-start gap-2">
        <Input
          type="text"
          id={`question-text-${question.id}`}
          data-testid={`question-text-${question.id}`}
          value={question.text}
          onChange={(e) => onChange({ ...question, text: e.target.value })}
          placeholder="Pergunta"
          className="flex-1"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          data-testid={`question-remove-${question.id}`}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      {/* Tipo e obrigatória */}
      <div className="flex items-center gap-4">
        <Select
          value={question.type}
          onValueChange={(value) => {
            const newType = value as Question["type"];
            onChange({
              ...question,
              type: newType,
              options: newType === "texto_longo" ? [] : question.options,
            });
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="texto_longo">Espontânea</SelectItem>
            <SelectItem value="unica_escolha">Induzida</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center space-x-2">
          <Checkbox
            id={`question-required-${question.id}`}
            checked={question.required}
            onCheckedChange={(checked) =>
              onChange({ ...question, required: !!checked })
            }
          />
          <Label htmlFor={`question-required-${question.id}`}>
            Obrigatória
          </Label>
        </div>
      </div>

      {/* Opções */}
      {showOptions && (
        <div className="space-y-2">
          <Label>Opções</Label>
          {question.options.map((opt, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Input
                type="text"
                id={`question-option-${question.id}-${idx}`}
                data-testid={`question-option-${question.id}-${idx}`}
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
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  const updatedOptions = question.options.filter(
                    (_, i) => i !== idx,
                  );
                  onChange({ ...question, options: updatedOptions });
                }}
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newOption: QuestionOption = { text: "" };
              onChange({
                ...question,
                options: [...question.options, newOption],
              });
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Adicionar opção
          </Button>
        </div>
      )}

      {/* Lógica condicional */}
      <div className="border-t pt-4 mt-2">
        {!logicOpen ? (
          <Button variant="link" size="sm" onClick={() => setLogicOpen(true)}>
            + Adicionar lógica condicional
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-medium">Lógica condicional</Label>
              <Button variant="link" size="sm" onClick={removeLogic}>
                Remover
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Ação</Label>
                <Select
                  value={logic?.action ?? "show"}
                  onValueChange={handleActionChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="show">Mostrar esta pergunta</SelectItem>
                    <SelectItem value="skip">Pular esta pergunta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Pergunta gatilho</Label>
                <Select
                  value={triggerQuestionId ? String(triggerQuestionId) : ""}
                  onValueChange={handleTriggerChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma pergunta" />
                  </SelectTrigger>
                  <SelectContent>
                    {allQuestions
                      .filter((q) => q.id !== question.id)
                      .map((q) => (
                        <SelectItem key={q.id} value={String(q.id)}>
                          {q.text || `Pergunta ${q.order ?? q.id}`}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {triggerQuestion && (
              <>
                <div>
                  <Label className="text-xs">Operador</Label>
                  <Select value={operator} onValueChange={handleOperatorChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equals">Igual a</SelectItem>
                      <SelectItem value="not_equals">Diferente de</SelectItem>
                      {triggerQuestion.type !== "texto_longo" && (
                        <>
                          <SelectItem value="contains">Contém</SelectItem>
                          <SelectItem value="not_contains">
                            Não contém
                          </SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">
                    {triggerQuestion.type === "multipla_escolha"
                      ? "Valores (selecione um ou mais)"
                      : "Valor"}
                  </Label>
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
