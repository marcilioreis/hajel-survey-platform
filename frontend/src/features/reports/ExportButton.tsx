import { useState, useEffect, useRef } from "react";
import {
  useRequestExportMutation,
  useLazyGetExportStatusQuery,
} from "../surveys/surveysApi";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ExportFormat = "csv" | "pdf" | "xlsx";

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
      <Select
        value={format}
        onValueChange={(value) => setFormat(value as ExportFormat)}
        disabled={isRequesting || !!exportId}
      >
        <SelectTrigger className="h-10 w-27.5">
          <SelectValue placeholder="Formato" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="csv">CSV</SelectItem>
          <SelectItem value="pdf">PDF</SelectItem>
          <SelectItem value="xlsx">Excel</SelectItem>
        </SelectContent>
      </Select>

      <Button
        onClick={handleExport}
        disabled={isRequesting || !!exportId}
        variant="default"
        size="sm"
      >
        {exportId
          ? "Processando..."
          : isRequesting
            ? "Iniciando..."
            : "Exportar"}
      </Button>
    </div>
  );
}
