import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useGetPermissionsQuery,
} from "./adminApi";
import { toast } from "sonner";
import type { AdminRole } from "../surveys/surveys.types";

interface RoleFormProps {
  initialRole?: AdminRole;
}

export default function RoleForm({ initialRole }: RoleFormProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(initialRole);

  const { data: allPermissions = [] } = useGetPermissionsQuery();
  const [createRole, { isLoading: isCreating }] = useCreateRoleMutation();
  const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation();

  const [name, setName] = useState(() => initialRole?.name ?? "");
  const [description, setDescription] = useState(
    () => initialRole?.description ?? "",
  );
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>(
    () => initialRole?.permissions?.map((p) => p.id) ?? [],
  );

  const togglePermission = (permId: number) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId)
        ? prev.filter((p) => p !== permId)
        : [...prev, permId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Informe o nome da role.");
      return;
    }
    try {
      if (isEditing) {
        await updateRole({
          id: Number(id),
          body: {
            name: name.trim(),
            description: description.trim(),
            permissions: selectedPermissions,
          },
        }).unwrap();
        toast.success("Role atualizada.");
      } else {
        await createRole({
          name: name.trim(),
          description: description.trim(),
          permissions: selectedPermissions,
        }).unwrap();
        toast.success("Role criada.");
      }
      navigate("/admin/roles");
    } catch {
      toast.error("Erro ao salvar role.");
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">
        {isEditing ? "Editar Role" : "Nova Role"}
      </h1>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-white p-6 rounded-lg shadow-sm"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Nome
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full p-3 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Descrição
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full p-3 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Permissões
          </label>
          {allPermissions.length === 0 ? (
            <p className="text-sm text-gray-500">
              Nenhuma permissão cadastrada.
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-2">
              {allPermissions.map((perm) => (
                <label key={perm.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedPermissions.includes(perm.id)}
                    onChange={() => togglePermission(perm.id)}
                  />
                  <span className="text-sm">{perm.code}</span>
                  {perm.description && (
                    <span className="text-xs text-gray-500">
                      ({perm.description})
                    </span>
                  )}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate("/admin/roles")}
            className="flex-1 py-3 border rounded-lg"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isCreating || isUpdating}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            {isCreating || isUpdating ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}
