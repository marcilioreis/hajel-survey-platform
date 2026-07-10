import { useMemo, useState, useDeferredValue } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SamplingValues } from "./surveys.types";
import {
  calcMarginOfError,
  calcSampleSize,
  adjustSampleForResponseRate,
  formatPercent,
} from "../../utils/statistics";

interface Props {
  value: SamplingValues;
  onChange: (value: SamplingValues) => void;
}

type Mode = "sample" | "margin";

// Conjunto de valores brutos (strings dos inputs) que descrevem o estado da calculadora.
interface Buffers {
  mode: Mode;
  sampleStr: string;
  marginStr: string;
  populationStr: string;
  proportionStr: string;
  responseRateStr: string;
  confidenceLevel: number;
}

// Converte string de input em número (ou undefined quando vazio/inválido).
const toNum = (s: string): number | undefined => {
  if (s.trim() === "") return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
};

// Deriva amostra/margem a partir dos buffers (fonte única usada por display e emit).
const derive = (b: Buffers) => {
  const populationSize = toNum(b.populationStr) ?? null;
  const expectedProportion = (toNum(b.proportionStr) ?? 50) / 100;
  const responseRateNum = toNum(b.responseRateStr);
  const responseRate = responseRateNum != null ? responseRateNum / 100 : null;
  const params = {
    confidenceLevel: b.confidenceLevel,
    expectedProportion,
    populationSize,
  };

  let statSample: number | undefined;
  let marginFrac: number | undefined;
  if (b.mode === "sample") {
    statSample = toNum(b.sampleStr);
    if (statSample != null && statSample > 0) {
      marginFrac = calcMarginOfError(statSample, params);
    }
  } else {
    const mi = toNum(b.marginStr);
    if (mi != null && mi > 0 && mi < 100) {
      marginFrac = mi / 100;
      statSample = calcSampleSize(marginFrac, params);
    }
  }

  return {
    populationSize,
    expectedProportion,
    responseRate,
    params,
    statSample,
    marginFrac,
  };
};

export default function MarginOfErrorCalculator({ value, onChange }: Props) {
  const [mode, setMode] = useState<Mode>(() =>
    value.marginOfError != null && value.sampleSize == null
      ? "margin"
      : "sample",
  );
  const [sampleStr, setSampleStr] = useState(() =>
    value.sampleSize != null ? String(value.sampleSize) : "",
  );
  const [marginStr, setMarginStr] = useState(() =>
    value.marginOfError != null
      ? String(+(value.marginOfError * 100).toFixed(2))
      : "",
  );
  const [populationStr, setPopulationStr] = useState(() =>
    value.populationSize != null ? String(value.populationSize) : "",
  );
  const [proportionStr, setProportionStr] = useState(() =>
    String(+(value.expectedProportion * 100).toFixed(2)),
  );
  const [responseRateStr, setResponseRateStr] = useState(() =>
    value.responseRate != null
      ? String(+(value.responseRate * 100).toFixed(2))
      : "",
  );

  const confidenceLevel = value.confidenceLevel || 0.95;

  const buffers: Buffers = {
    mode,
    sampleStr,
    marginStr,
    populationStr,
    proportionStr,
    responseRateStr,
    confidenceLevel,
  };

  const {
    populationSize,
    expectedProportion,
    responseRate,
    params,
    statSample,
    marginFrac,
  } = derive(buffers);

  // Propaga o estado consolidado para o formulário pai a partir de um conjunto de buffers.
  const computeAndEmit = (b: Buffers) => {
    const d = derive(b);
    onChange({
      sampleSize: d.statSample,
      marginOfError: d.marginFrac,
      populationSize: d.populationSize,
      confidenceLevel: b.confidenceLevel,
      expectedProportion: d.expectedProportion,
      responseRate: d.responseRate,
    });
  };

  // Validações de negócio (avisos não bloqueantes).
  const warnings: string[] = [];
  const marginInput = toNum(marginStr);
  if (marginInput != null && (marginInput <= 0 || marginInput >= 100))
    warnings.push("A margem de erro deve estar entre 0% e 100%.");
  const proportionPct = toNum(proportionStr);
  if (proportionPct != null && (proportionPct <= 0 || proportionPct >= 100))
    warnings.push("A proporção esperada deve estar entre 0% e 100%.");
  const responseRatePct = toNum(responseRateStr);
  if (
    responseRatePct != null &&
    (responseRatePct <= 0 || responseRatePct > 100)
  )
    warnings.push("A taxa de resposta deve estar entre 0% e 100%.");
  if (
    statSample != null &&
    populationSize != null &&
    statSample > populationSize
  )
    warnings.push("O tamanho da amostra é maior que a população informada.");

  const adjustedSample =
    statSample != null
      ? adjustSampleForResponseRate(statSample, responseRate)
      : undefined;

  // Dados da curva margem × amostra (deferred para suavizar o redesenho).
  const curveKey = useDeferredValue(
    `${statSample ?? ""}-${confidenceLevel}-${expectedProportion}-${populationSize ?? ""}`,
  );
  const curveData = useMemo(() => {
    const base = statSample && statSample > 0 ? statSample : 1000;
    const nMax = populationSize
      ? populationSize
      : Math.max(Math.ceil(base * 2), 1500);
    const nMin = Math.max(10, Math.floor(nMax / 100));
    const steps = 30;
    const pts: { n: number; margin: number }[] = [];
    for (let i = 0; i <= steps; i++) {
      const n = Math.round(nMin + ((nMax - nMin) * i) / steps);
      if (n < 2) continue;
      pts.push({ n, margin: +(calcMarginOfError(n, params) * 100).toFixed(2) });
    }
    return pts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curveKey]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calculadora de margem de erro</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Parâmetros comuns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label htmlFor="moe-confidence">Nível de confiança</Label>
            <Select
              value={String(confidenceLevel)}
              onValueChange={(v) => {
                const next = { ...buffers, confidenceLevel: Number(v) };
                computeAndEmit(next);
              }}
            >
              <SelectTrigger id="moe-confidence">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.9">90%</SelectItem>
                <SelectItem value="0.95">95%</SelectItem>
                <SelectItem value="0.99">99%</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="moe-proportion">Proporção esperada (%)</Label>
            <Input
              id="moe-proportion"
              type="number"
              min="1"
              max="99"
              value={proportionStr}
              onChange={(e) => {
                setProportionStr(e.target.value);
                computeAndEmit({ ...buffers, proportionStr: e.target.value });
              }}
              placeholder="50"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="moe-population">População (opcional)</Label>
            <Input
              id="moe-population"
              type="number"
              min="1"
              value={populationStr}
              onChange={(e) => {
                setPopulationStr(e.target.value);
                computeAndEmit({ ...buffers, populationStr: e.target.value });
              }}
              placeholder="Infinita"
            />
          </div>
        </div>

        {/* Modo */}
        <Tabs
          value={mode}
          onValueChange={(v) => {
            const m = v as Mode;
            setMode(m);
            computeAndEmit({ ...buffers, mode: m });
          }}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sample">Tenho a amostra</TabsTrigger>
            <TabsTrigger value="margin">Quero a margem</TabsTrigger>
          </TabsList>

          <TabsContent value="sample" className="space-y-2 pt-3">
            <Label htmlFor="moe-sample">Tamanho da amostra (n)</Label>
            <Input
              id="moe-sample"
              type="number"
              min="1"
              value={sampleStr}
              onChange={(e) => {
                setSampleStr(e.target.value);
                computeAndEmit({
                  ...buffers,
                  mode: "sample",
                  sampleStr: e.target.value,
                });
              }}
              placeholder="Ex.: 384"
            />
          </TabsContent>

          <TabsContent value="margin" className="space-y-2 pt-3">
            <Label htmlFor="moe-margin">Margem de erro desejada (%)</Label>
            <Input
              id="moe-margin"
              type="number"
              min="0.1"
              max="50"
              step="0.1"
              value={marginStr}
              onChange={(e) => {
                setMarginStr(e.target.value);
                computeAndEmit({
                  ...buffers,
                  mode: "margin",
                  marginStr: e.target.value,
                });
              }}
              placeholder="Ex.: 5"
            />
          </TabsContent>
        </Tabs>

        {/* Taxa de resposta */}
        <div className="space-y-1">
          <Label htmlFor="moe-response-rate">
            Taxa de resposta esperada (%) — opcional
          </Label>
          <Input
            id="moe-response-rate"
            type="number"
            min="1"
            max="100"
            value={responseRateStr}
            onChange={(e) => {
              setResponseRateStr(e.target.value);
              computeAndEmit({ ...buffers, responseRateStr: e.target.value });
            }}
            placeholder="Ex.: 80"
          />
        </div>

        {/* Avisos */}
        {warnings.length > 0 && (
          <ul className="text-sm text-destructive list-disc pl-5 space-y-0.5">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        )}

        {/* Resultado */}
        <div className="bg-muted rounded-lg p-4 space-y-1" aria-live="polite">
          {marginFrac != null && statSample != null ? (
            <>
              <p className="text-sm">
                <span className="text-muted-foreground">Margem de erro: </span>
                <span className="font-semibold">
                  {formatPercent(marginFrac)}
                </span>
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Amostra (n): </span>
                <span className="font-semibold">
                  {statSample.toLocaleString("pt-BR")}
                </span>
              </p>
              {adjustedSample != null && adjustedSample !== statSample && (
                <p className="text-sm">
                  <span className="text-muted-foreground">
                    Abordagens necessárias (com taxa de resposta):{" "}
                  </span>
                  <span className="font-semibold">
                    {adjustedSample.toLocaleString("pt-BR")}
                  </span>
                </p>
              )}
              <p className="text-xs text-muted-foreground pt-1">
                Para n={statSample.toLocaleString("pt-BR")}
                {populationSize
                  ? ` em uma população de ${populationSize.toLocaleString("pt-BR")}`
                  : " (população infinita)"}
                , a margem é de ~{formatPercent(marginFrac)} com{" "}
                {formatPercent(confidenceLevel, 0)} de confiança.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Informe os valores acima para ver o resultado.
            </p>
          )}
        </div>

        {/* Curva margem × amostra */}
        {curveData.length > 1 && (
          <div className="pt-2">
            <p className="text-xs text-muted-foreground mb-1">
              Margem de erro (%) conforme o tamanho da amostra
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart
                data={curveData}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="n" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: number) => `${v}%`}
                  width={40}
                />
                <Tooltip
                  formatter={(v) => [`${Number(v).toFixed(2)}%`, "Margem"]}
                  labelFormatter={(l) => `n = ${l}`}
                />
                <Line
                  type="monotone"
                  dataKey="margin"
                  stroke="hsl(220, 70%, 50%)"
                  strokeWidth={2}
                  dot={false}
                />
                {statSample != null && marginFrac != null && (
                  <ReferenceDot
                    x={statSample}
                    y={+(marginFrac * 100).toFixed(2)}
                    r={5}
                    fill="hsl(0, 70%, 50%)"
                    stroke="white"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
