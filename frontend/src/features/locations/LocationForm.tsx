import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useAppDispatch } from "../../app/hooks";
import { api } from "../../lib/api";
import {
  useCreateLocationMutation,
  useUpdateLocationMutation,
} from "../surveys/surveysApi";
import {
  useGetStatesQuery,
  useGetMunicipalitiesQuery,
  useGetNeighborhoodsQuery,
} from "../geography/geographyApi";
import type { Location, LocationPayload } from "../surveys/surveys.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelectNeighborhood } from "./MultiSelectNeighborhood";
import { MultiSelectCity } from "./MultiSelectCity";

interface LocationFormProps {
  initialLocation?: Location;
}

export default function LocationForm({ initialLocation }: LocationFormProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(initialLocation);

  const [createLocation] = useCreateLocationMutation();
  const [updateLocation] = useUpdateLocationMutation();
  const dispatch = useAppDispatch();

  const [form, setForm] = useState<LocationPayload>(() => ({
    name: initialLocation?.name ?? "",
    state: initialLocation?.state ?? "",
    city: Array.isArray(initialLocation?.city)
      ? initialLocation.city
      : initialLocation?.city
        ? [initialLocation.city]
        : [],
    neighborhood: initialLocation?.neighborhood ?? [],
    cep: initialLocation?.cep ?? "",
    address: initialLocation?.address ?? "",
    ibgeCode: initialLocation?.ibgeCode ?? "",
    notes: initialLocation?.notes ?? "",
    studiedUniverse: initialLocation?.studiedUniverse ?? "",
  }));

  const { data: states = [] } = useGetStatesQuery();
  const { data: municipalities = [] } = useGetMunicipalitiesQuery(form.state, {
    skip: !form.state,
  });

  // Fetch neighborhoods only when EXACTLY one city is selected to avoid confusion,
  // or use the first city as a reference for neighborhood suggestions.
  const { data: neighborhoodsData = [] } = useGetNeighborhoodsQuery(
    { city: form.city?.[0] || "", uf: form.state },
    { skip: form.city?.length !== 1 || !form.state },
  );

  const allNeighborhoods = neighborhoodsData;

  const [isCepLoading, setIsCepLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !form.name.trim() ||
      !form.state ||
      !form.city?.length ||
      !form.studiedUniverse.trim()
    ) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    try {
      if (isEditing) {
        await updateLocation({ id: Number(id), body: form }).unwrap();
      } else {
        await createLocation(form).unwrap();
      }
      // Invalida manualmente as tags de Location
      dispatch(api.util.invalidateTags(["Location"]));
      toast.success(isEditing ? "Local atualizado." : "Local criado.");
      navigate("/locations");
    } catch {
      toast.error("Erro ao salvar.");
    }
  };

  const handleCepBlur = async () => {
    const cep = form.cep?.replace(/\D/g, "");

    if (!cep || cep.length !== 8) return;

    setIsCepLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const res = await fetch(`${baseUrl}/api/geography/cep/${cep}`);
      const data = await res.json();
      if (data && !data.erro) {
        setForm((prev) => ({
          ...prev,
          address: data.logradouro || "",
          neighborhood: data.bairro ? [data.bairro] : prev.neighborhood,
          city: data.localidade ? [data.localidade] : prev.city,
          state: data.uf || prev.state,
          cep: data.cep || prev.cep,
        }));
      }
    } catch {
      toast.error("Erro ao buscar CEP.");
    } finally {
      setIsCepLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-bold">
        {isEditing ? "Editar Local" : "Novo Local"}
      </h1>

      <div className="space-y-2">
        <Label htmlFor="location-name">Nome do local *</Label>
        <Input
          id="location-name"
          data-testid="location-name"
          placeholder="Ex: Loja Centro"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location-studied-universe">Universo Pesquisado *</Label>
        <Input
          id="location-studied-universe"
          data-testid="location-studied-universe"
          placeholder="Ex: População geral, Profissionais de saúde"
          value={form.studiedUniverse}
          onChange={(e) =>
            setForm({ ...form, studiedUniverse: e.target.value })
          }
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location-state">Estado *</Label>
        <Select
          value={form.state}
          onValueChange={(value) =>
            setForm({ ...form, state: value, city: [], neighborhood: [] })
          }
        >
          <SelectTrigger id="location-state">
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {states.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location-city">Municípios *</Label>
        <MultiSelectCity
          options={municipalities}
          selected={form.city || []}
          onChange={(value) =>
            setForm({ ...form, city: value, neighborhood: [] })
          }
          disabled={!form.state}
        />
      </div>

      {(!form.city || form.city.length <= 1) && (
        <div className="space-y-2">
          <Label htmlFor="location-neighborhood">Bairros</Label>
          <MultiSelectNeighborhood
            options={allNeighborhoods}
            selected={form.neighborhood || []}
            onChange={(value) => setForm({ ...form, neighborhood: value })}
          />
        </div>
      )}

      <div className="space-y-2 hidden">
        <Label htmlFor="location-cep">CEP</Label>
        <Input
          id="location-cep"
          placeholder="00000-000"
          value={form.cep ?? ""}
          onChange={(e) => setForm({ ...form, cep: e.target.value })}
          onBlur={handleCepBlur}
        />
        {isCepLoading && (
          <span className="text-sm text-muted-foreground">Buscando CEP...</span>
        )}
      </div>

      <div className="space-y-2 hidden">
        <Label htmlFor="location-address">Endereço</Label>
        <Input
          id="location-address"
          placeholder="Rua, número"
          value={form.address ?? ""}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location-notes">Observações</Label>
        <Textarea
          id="location-notes"
          data-testid="location-notes"
          placeholder="Notas internas sobre este local"
          rows={3}
          value={form.notes ?? ""}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          type="button"
          onClick={() => navigate("/locations")}
        >
          Cancelar
        </Button>
        <Button type="submit">Salvar</Button>
      </div>
    </form>
  );
}
