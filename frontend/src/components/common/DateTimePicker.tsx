import { parseISOToLocalDate } from "@/utils/date";
import { DayPicker } from "react-day-picker";
import { ptBR } from "react-day-picker/locale";

interface DateTimeRangePickerProps {
  startValue: string;
  endValue: string;
  onStartChange: (isoString: string) => void;
  onEndChange: (isoString: string) => void;
  required?: boolean;
  minDate?: Date;
}

export default function DateTimePicker({
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  required,
  minDate,
}: DateTimeRangePickerProps) {
  const fromDate = parseISOToLocalDate(startValue);
  const toDate = parseISOToLocalDate(endValue);

  const startTimeValue = startValue ? startValue.slice(11, 16) : "00:00";
  const endTimeValue = endValue ? endValue.slice(11, 16) : "23:59";

  const handleRangeSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (!range?.from) {
      onStartChange("");
      onEndChange("");
      return;
    }

    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    if (range.from) {
      const startDateStr = formatDate(range.from);
      onStartChange(`${startDateStr}T${startTimeValue}:00.000Z`);
    }

    if (range.to) {
      const endDateStr = formatDate(range.to);
      onEndChange(`${endDateStr}T${endTimeValue}:00.000Z`);
    } else if (range.from) {
      const endDateStr = formatDate(range.from);
      onEndChange(`${endDateStr}T${endTimeValue}:00.000Z`);
    }
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (fromDate) {
      const dateStr = fromDate.toISOString().slice(0, 10);
      onStartChange(`${dateStr}T${e.target.value}:00.000Z`);
    }
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (toDate) {
      const dateStr = toDate.toISOString().slice(0, 10);
      onEndChange(`${dateStr}T${e.target.value}:00.000Z`);
    } else if (fromDate) {
      const dateStr = fromDate.toISOString().slice(0, 10);
      onEndChange(`${dateStr}T${e.target.value}:00.000Z`);
    }
  };

  return (
    <div className="space-y-3">
      {required && (
        <input
          type="text"
          id="datetimepicker-required"
          name="datetimepicker-required"
          data-testid="datetimepicker-required"
          value={startValue}
          required={required}
          onChange={() => {}}
          className="sr-only"
          tabIndex={-1}
        />
      )}

      {/* Seletores de horário (ocultos) */}
      <div className="gap-4 hidden">
        <div className="flex-1">
          <label
            htmlFor="datetimepicker-start-time"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Horário de início
          </label>
          <input
            type="time"
            id="datetimepicker-start-time"
            name="datetimepicker-start-time"
            data-testid="datetimepicker-start-time"
            value={startTimeValue}
            onChange={handleStartTimeChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-base"
          />
        </div>
        <div className="flex-1">
          <label
            htmlFor="datetimepicker-end-time"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Horário de término
          </label>
          <input
            type="time"
            id="datetimepicker-end-time"
            name="datetimepicker-end-time"
            data-testid="datetimepicker-end-time"
            value={endTimeValue}
            onChange={handleEndTimeChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-base"
          />
        </div>
      </div>

      <DayPicker
        mode="range"
        locale={ptBR}
        selected={{ from: fromDate, to: toDate }}
        onSelect={handleRangeSelect}
        disabled={minDate ? { before: minDate } : undefined}
        numberOfMonths={1}
        className="p-3 bg-white border rounded-lg"
        classNames={{
          root: "relative text-sm",
          months: "relative flex flex-wrap justify-center gap-8",
          month_caption: "font-medium text-lg h-9",
          nav: "absolute inset-x-0 flex justify-between items-center h-9 gap-2",
          button_previous:
            "relative inline-flex items-center justify-center size-9 hover:bg-gray-100 rounded",
          button_next:
            "relative inline-flex items-center justify-center size-9 hover:bg-gray-100 rounded",
          chevron: "inline-block size-7 fill-gray-400",
          week: "grid grid-cols-7",
          weekdays: "grid grid-cols-7",
          weekday: "size-9 flex items-center justify-center text-gray-500",
          day: "inline-flex items-center justify-center text-gray-700 hover:bg-gray-200 hover:text-gray-900 size-9 font-normal aria-selected:opacity-100 cursor-pointer",
          today: "bg-gray-100 font-semibold",
          range_start: "bg-gray-500 text-white rounded-l-full",
          range_end: "bg-gray-500 text-white rounded-r-full",
          range_middle: "bg-gray-200 text-gray-700",
          selected:
            "text-white hover:bg-gray-500 hover:text-white focus:bg-gray-500 focus:text-white",
          outside: "text-gray-500 opacity-50",
          disabled: "text-gray-500 opacity-50 cursor-auto",
          hidden: "invisible",
        }}
        footer={
          fromDate ? (
            <p className="text-xs text-gray-500 mt-2 pt-2 border-t">
              {toDate
                ? `De ${fromDate.toLocaleDateString("pt-BR")} até ${toDate.toLocaleDateString("pt-BR")}`
                : `Início: ${fromDate.toLocaleDateString("pt-BR")}`}
            </p>
          ) : null
        }
      />
    </div>
  );
}
