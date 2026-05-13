import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface MultiSelectCityProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function MultiSelectCity({
  options,
  selected,
  onChange,
  placeholder,
  disabled,
}: MultiSelectCityProps) {
  const [search, setSearch] = useState("");

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(search.toLowerCase()),
  );

  const toggleOption = (value: string) => {
    if (disabled) return;
    if (selected.includes(value)) {
      onChange(selected.filter((s) => s !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div
      className={`space-y-3 ${disabled ? "opacity-50 pointer-events-none" : ""}`}
    >
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 border rounded-md bg-muted/30">
          {selected.map((s) => (
            <Badge
              key={s}
              variant="secondary"
              className="flex items-center gap-1 py-1 px-2"
            >
              {s}
              <X
                className="h-3.5 w-3.5 cursor-pointer hover:text-destructive transition-colors"
                onClick={() => toggleOption(s)}
              />
            </Badge>
          ))}
        </div>
      )}
      <div className="space-y-2">
        <Input
          placeholder={placeholder ?? "Buscar cidades..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9"
          disabled={disabled}
        />
        <div className="border rounded-md max-h-52 overflow-y-auto p-1 bg-background">
          {filteredOptions.length > 0 ? (
            <div className="grid grid-cols-1 gap-1">
              {filteredOptions.map((opt) => (
                <div
                  key={opt}
                  className="flex items-center gap-2 hover:bg-muted/50 p-2 rounded-sm transition-colors cursor-pointer"
                  onClick={() => toggleOption(opt)}
                >
                  <Checkbox
                    id={`city-${opt}`}
                    checked={selected.includes(opt)}
                    onCheckedChange={() => toggleOption(opt)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Label
                    htmlFor={`city-${opt}`}
                    className="flex-1 cursor-pointer text-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {opt}
                  </Label>
                </div>
              ))}
            </div>
          ) : search.trim() !== "" ? (
            <div
              className="flex items-center gap-2 hover:bg-muted/50 p-2 rounded-sm transition-colors cursor-pointer"
              onClick={() => {
                const val = search.trim();
                if (!selected.includes(val)) {
                  toggleOption(val);
                }
                setSearch("");
              }}
            >
              <div className="h-4 w-4 border rounded-sm flex items-center justify-center">
                <X className="h-3 w-3 rotate-45" />
              </div>
              <p className="text-sm">
                Adicionar "<span className="font-medium">{search}</span>"
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground p-4 text-center">
              {options.length === 0
                ? "Selecione um estado primeiro."
                : "Nenhuma cidade encontrada."}
            </p>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground px-1">
          {selected.length} selecionada(s)
        </p>
      </div>
    </div>
  );
}
