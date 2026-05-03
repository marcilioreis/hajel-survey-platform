import { useState, useEffect, useRef } from "react";
import {
  useRequestExportMutation,
  useLazyGetExportStatusQuery,
} from "../surveys/surveysApi";
import { toast } from "sonner";

interface ExportButtonProps {
  surveyId: string;
}

export default function ExportButton({ surveyId }: ExportButtonProps) {
  const [requestExport, { isLoading: isRequesting }] =
    useRequestExportMutation();
  const [triggerStatus] = useLazyGetExportStatusQuery();
  const [exportId, setExportId] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const errorCountRef = useRef(0);

  const downloadFile = async (url: string) => {
    try {
      const token = localStorage.getItem("auth-token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:3000"}${url}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );
      if (!response.ok) throw new Error("Falha no download");
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `resultados_${surveyId}.csv`; // nome padrão; pode vir do header Content-Disposition
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
      toast.success("Download iniciado.");
    } catch {
      toast.error("Erro ao baixar o arquivo.");
    }
  };

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
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          setExportId(null);
          toast.success("Exportação concluída!");
          // Corrige a URL relativa para a rota completa
          if (status.downloadLink) {
            // Se o backend retornar apenas "/api/exports/24/download", substituímos para "/api/surveys/exports/24/download"
            const correctedUrl = status.downloadLink.replace(
              "/api/exports/",
              "/api/surveys/exports/",
            );
            downloadFile(correctedUrl);
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
      const result = await requestExport({ surveyId }).unwrap();
      setExportId(result.exportId);
      startPolling(result.exportId);
      toast.info("Exportação iniciada. Aguarde...");
    } catch {
      toast.error("Erro ao solicitar exportação.");
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isRequesting || !!exportId}
      className="py-2 px-4 bg-green-600 text-white rounded-lg disabled:opacity-50"
    >
      {exportId
        ? "Processando..."
        : isRequesting
          ? "Iniciando..."
          : "Exportar (Excel/PDF)"}
    </button>
  );
}
