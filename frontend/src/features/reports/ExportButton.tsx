import { useState, useEffect, useRef } from "react";
import {
  useRequestExportMutation,
  useLazyGetExportStatusQuery,
} from "../surveys/surveysApi";
import { toast } from "sonner";

type ExportFormat = "csv" | "pdf" | "xlsx"; // formatos suportados

interface ExportButtonProps {
  surveyId: string;
}

export default function ExportButton({ surveyId }: ExportButtonProps) {
  const [requestExport, { isLoading: isRequesting }] =
    useRequestExportMutation();
  const [triggerStatus] = useLazyGetExportStatusQuery();
  const [exportId, setExportId] = useState<string | null>(null);
  const [format, setFormat] = useState<ExportFormat>("csv");

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const errorCountRef = useRef(0);

  const stopPolling = (msg?: string) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setExportId(null);
    if (msg) toast.error(msg);
  };

  const startPolling = (id: string) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    errorCountRef.current = 0;

    intervalRef.current = setInterval(async () => {
      try {
        const status = await triggerStatus(id).unwrap();
        errorCountRef.current = 0;

        if (status.status === "concluido") {
          stopPolling();
          toast.success("Exportação concluída!");
          if (status.downloadLink) {
            window.open(status.downloadLink, "_blank");
          }
        } else if (status.status === "falha") {
          stopPolling("Falha na exportação.");
        }
      } catch {
        errorCountRef.current += 1;
        if (errorCountRef.current >= 3) {
          stopPolling("Erro ao verificar status. Tente novamente.");
        }
      }
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleExport = async () => {
    try {
      const result = await requestExport({ surveyId, format }).unwrap();
      setExportId(result.exportId);
      startPolling(result.exportId);
      toast.info("Exportação iniciada. Aguarde...");
    } catch {
      toast.error("Erro ao solicitar exportação.");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={format}
        onChange={(e) => setFormat(e.target.value as ExportFormat)}
        disabled={isRequesting || !!exportId}
        className="h-10 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white disabled:opacity-50"
      >
        <option value="csv">CSV</option>
        <option value="pdf">PDF</option>
        <option value="xlsx">Excel (XLSX)</option>
      </select>

      <button
        onClick={handleExport}
        disabled={isRequesting || !!exportId}
        className="py-2 px-4 bg-green-600 text-white rounded-lg disabled:opacity-50 whitespace-nowrap"
      >
        {exportId
          ? "Processando..."
          : isRequesting
            ? "Iniciando..."
            : "Exportar"}
      </button>
    </div>
  );
}
