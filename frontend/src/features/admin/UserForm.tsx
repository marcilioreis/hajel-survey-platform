import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUpdateUserMutation, useGetRolesQuery } from "./adminApi";
import { toast } from "sonner";
import type { AdminUser } from "../surveys/surveys.types";

interface UserFormProps {
  initialUser?: AdminUser;
}

export default function UserForm({ initialUser }: UserFormProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(initialUser);

  const { data: allRoles = [] } = useGetRolesQuery();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();

  const [name, setName] = useState(() => initialUser?.name ?? "");
  const [email, setEmail] = useState(() => initialUser?.email ?? "");
  const [active, setActive] = useState(() => initialUser?.active ?? true);
  const [selectedRoles, setSelectedRoles] = useState<number[]>(
    () => initialUser?.roles?.map((r) => r.roleId) ?? [],
  );

  const toggleRole = (roleId: number) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId)
        ? prev.filter((r) => r !== roleId)
        : [...prev, roleId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Preencha nome e e-mail.");
      return;
    }
    try {
      await updateUser({
        id: id!,
        body: {
          name: name.trim(),
          email: email.trim(),
          active,
          roles: selectedRoles,
        },
      }).unwrap();
      toast.success("Usuário atualizado.");
      navigate("/admin/users");
    } catch {
      toast.error("Erro ao atualizar usuário.");
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">
        {isEditing ? "Editar Usuário" : "Novo Usuário"}
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
            E-mail
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-3 border rounded-lg"
          />
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
          />
          <span className="text-sm">Ativo</span>
        </label>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Roles
          </label>
          {allRoles.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhuma role disponível.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2">
              {allRoles.map((role) => (
                <label key={role.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role.id)}
                    onChange={() => toggleRole(role.id)}
                  />
                  <span className="text-sm">{role.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate("/admin/users")}
            className="flex-1 py-3 border rounded-lg"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isUpdating}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            {isUpdating ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}
