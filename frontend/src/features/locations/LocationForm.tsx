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

interface LocationFormProps {
  initialLocation?: Location;
}

export default function LocationForm({ initialLocation }: LocationFormProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(initialLocation);

  const [createLocation] = useCreateLocationMutation();
  const [updateLocation] = useUpdateLocationMutation();

  const [form, setForm] = useState<LocationPayload>(() => ({
    name: initialLocation?.name ?? "",
    state: initialLocation?.state ?? "",
    city: initialLocation?.city ?? "",
    neighborhood: initialLocation?.neighborhood ?? "",
    cep: initialLocation?.cep ?? "",
    address: initialLocation?.address ?? "",
    ibgeCode: initialLocation?.ibgeCode ?? "",
    notes: initialLocation?.notes ?? "",
  }));

  // Queries de geografia
  const { data: states = [] } = useGetStatesQuery();
  const { data: municipalities = [] } = useGetMunicipalitiesQuery(form.state, {
    skip: !form.state,
  });
  const { data: neighborhoods = [] } = useGetNeighborhoodsQuery(
    { city: form.city, uf: form.state },
    { skip: !form.city || !form.state },
  );
  const [isCepLoading, setIsCepLoading] = useState(false);
  const dispatch = useAppDispatch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim() || !form.state || !form.city) {
      toast.error("Preencha nome, estado e cidade.");
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
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
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
    <form
      onSubmit={handleSubmit}
      className="p-4 pb-20 max-w-md mx-auto space-y-4"
      data-testid="location-form"
    >
      <h1 className="text-xl font-bold">
        {isEditing ? "Editar Local" : "Novo Local"}
      </h1>

      {/* Nome */}
      <div>
        <label
          htmlFor="location-name"
          className="block text-sm font-medium text-gray-700"
        >
          Nome do local *
        </label>
        <input
          id="location-name"
          name="location-name"
          data-testid="location-name"
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          className="w-full p-3 border rounded-lg"
          placeholder="Ex: Loja Centro"
        />
      </div>

      {/* UF */}
      <div>
        <label
          htmlFor="location-state"
          className="block text-sm font-medium text-gray-700"
        >
          Estado *
        </label>
        <select
          id="location-state"
          name="location-state"
          data-testid="location-state"
          value={form.state}
          onChange={(e) => {
            setForm({
              ...form,
              state: e.target.value,
              city: "",
              neighborhood: "",
            });
          }}
          required
          className="w-full p-3 border rounded-lg"
        >
          <option value="">Selecione</option>
          {states.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Município */}
      <div>
        <label
          htmlFor="location-city"
          className="block text-sm font-medium text-gray-700"
        >
          Município *
        </label>
        <select
          id="location-city"
          name="location-city"
          data-testid="location-city"
          value={form.city}
          onChange={(e) => {
            setForm({ ...form, city: e.target.value, neighborhood: "" });
          }}
          required
          disabled={!form.state}
          className="w-full p-3 border rounded-lg disabled:opacity-50"
        >
          <option value="">Selecione</option>
          {municipalities.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {/* Bairro */}
      <div>
        <label
          htmlFor="location-neighborhood"
          className="block text-sm font-medium text-gray-700"
        >
          Bairro
        </label>
        {neighborhoods.length > 0 ? (
          <select
            id="location-neighborhood"
            name="location-neighborhood"
            data-testid="location-neighborhood"
            value={form.neighborhood}
            onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
            className="w-full p-3 border rounded-lg"
          >
            <option value="">Selecione</option>
            {neighborhoods.map((b) => (
              <option key={b.name} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>
        ) : (
          <input
            id="location-neighborhood"
            name="location-neighborhood"
            data-testid="location-neighborhood"
            type="text"
            value={form.neighborhood}
            onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
            placeholder="Digite o bairro"
            className="w-full p-3 border rounded-lg"
          />
        )}
      </div>

      {/* CEP */}
      <div className="hidden">
        <label
          htmlFor="location-cep"
          className="block text-sm font-medium text-gray-700"
        >
          CEP
        </label>
        <input
          id="location-cep"
          name="location-cep"
          data-testid="location-cep"
          type="text"
          value={form.cep || ""}
          onChange={(e) => setForm({ ...form, cep: e.target.value })}
          onBlur={handleCepBlur}
          placeholder="00000-000"
          className="w-full p-3 border rounded-lg"
        />
        {isCepLoading && (
          <span className="text-sm text-gray-500">Buscando CEP...</span>
        )}
      </div>

      {/* Endereço */}
      <div className="hidden">
        <label
          htmlFor="location-address"
          className="block text-sm font-medium text-gray-700"
        >
          Endereço
        </label>
        <input
          id="location-address"
          name="location-address"
          data-testid="location-address"
          type="text"
          value={form.address || ""}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          className="w-full p-3 border rounded-lg"
          placeholder="Rua, número"
        />
      </div>

      {/* Observações */}
      <div>
        <label
          htmlFor="location-notes"
          className="block text-sm font-medium text-gray-700"
        >
          Observações
        </label>
        <textarea
          id="location-notes"
          name="location-notes"
          data-testid="location-notes"
          value={form.notes || ""}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={3}
          className="w-full p-3 border rounded-lg"
          placeholder="Notas internas sobre este local"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => navigate("/locations")}
          data-testid="location-cancel"
          className="flex-1 py-3 border rounded-lg"
        >
          Cancelar
        </button>
        <button
          type="submit"
          data-testid="location-submit"
          className="flex-1 py-3 bg-blue-600 text-white rounded-lg"
        >
          Salvar
        </button>
      </div>
    </form>
  );
}
