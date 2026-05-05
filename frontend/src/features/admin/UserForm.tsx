import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useCreateUserMutation,
  useUpdateUserMutation,
  useGetRolesQuery,
} from "./adminApi";
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
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();

  const [name, setName] = useState(() => initialUser?.name ?? "");
  const [email, setEmail] = useState(() => initialUser?.email ?? "");
  const [password, setPassword] = useState("");
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
    if (!isEditing && !password) {
      toast.error("Informe uma senha para o novo usuário.");
      return;
    }

    try {
      if (isEditing) {
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
      } else {
        await createUser({
          name: name.trim(),
          email: email.trim(),
          password,
          active,
          roleIds: selectedRoles,
        }).unwrap();
        toast.success("Usuário criado com sucesso.");
      }
      navigate("/admin/users");
    } catch {
      toast.error("Erro ao salvar usuário.");
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
        data-testid="user-form"
      >
        <div>
          <label
            htmlFor="user-name"
            className="block text-sm font-medium text-gray-700"
          >
            Nome
          </label>
          <input
            id="user-name"
            name="user-name"
            data-testid="user-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full p-3 border rounded-lg"
          />
        </div>
        <div>
          <label
            htmlFor="user-email"
            className="block text-sm font-medium text-gray-700"
          >
            E-mail
          </label>
          <input
            id="user-email"
            name="user-email"
            data-testid="user-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-3 border rounded-lg"
          />
        </div>
        {!isEditing && (
          <div>
            <label
              htmlFor="user-password"
              className="block text-sm font-medium text-gray-700"
            >
              Senha
            </label>
            <input
              id="user-password"
              name="user-password"
              data-testid="user-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={!isEditing}
              className="w-full p-3 border rounded-lg"
              placeholder="Mínimo 8 caracteres"
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            id="user-active"
            name="user-active"
            data-testid="user-active"
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="user-active" className="text-sm">
            Ativo
          </label>
        </div>

        <fieldset>
          <legend className="block text-sm font-medium text-gray-700 mb-2">
            Roles
          </legend>
          {allRoles.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhuma role disponível.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2">
              {allRoles.map((role) => (
                <label key={role.id} className="flex items-center gap-2">
                  <input
                    id={`user-role-${role.id}`}
                    name={`user-role-${role.id}`}
                    data-testid={`user-role-${role.id}`}
                    type="checkbox"
                    checked={selectedRoles.includes(role.id)}
                    onChange={() => toggleRole(role.id)}
                  />
                  <span className="text-sm">{role.name}</span>
                </label>
              ))}
            </div>
          )}
        </fieldset>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate("/admin/users")}
            data-testid="user-cancel"
            className="flex-1 py-3 border rounded-lg"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isCreating || isUpdating}
            data-testid="user-submit"
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            {isCreating || isUpdating ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}
