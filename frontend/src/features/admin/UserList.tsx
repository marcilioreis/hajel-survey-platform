import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGetUsersQuery, useDeleteUserMutation } from "./adminApi";
import { toast } from "sonner";

export default function UserList() {
  const { data: users, isLoading } = useGetUsersQuery();
  const [deleteUser] = useDeleteUserMutation();
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const filteredUsers = users?.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir/desativar este usuário?"))
      return;
    try {
      await deleteUser(id).unwrap();
      toast.success("Usuário desativado/excluído.");
    } catch {
      toast.error("Erro ao desativar usuário.");
    }
  };

  if (isLoading) return <div className="p-4">Carregando usuários...</div>;

  return (
    <div className="p-4 pb-20">
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => navigate(-1)} className="text-blue-600">
          ← Voltar
        </button>
        <h1 className="text-xl font-bold">Usuários</h1>
        <button
          onClick={() => navigate("/admin/users/new")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Novo Usuário
        </button>
      </div>
      <input
        type="text"
        placeholder="Buscar por nome ou email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full p-2 border rounded mb-4"
      />
      <div className="space-y-3">
        {filteredUsers?.map((user) => (
          <div
            key={user.id}
            className="bg-white p-4 rounded-lg shadow-sm flex flex-col sm:flex-row sm:items-center justify-between"
          >
            <div>
              <p className="text-left font-medium">{user.name}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
              <div className="flex gap-1 mt-1">
                {user.roles?.map((r) => (
                  <span
                    key={r.roleId}
                    className={`text-xs  px-2 py-1 rounded-full ${
                      r.roleName === "admin"
                        ? "bg-blue-100 text-blue-800"
                        : r.roleName === "researcher"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                    }`}
                  >
                    {r.roleName === "admin"
                      ? "Administrador"
                      : r.roleName === "researcher"
                        ? "Pesquisador"
                        : "Visualizador"}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-2 mt-2 sm:mt-0">
              <button
                onClick={() => navigate(`/admin/users/${user.id}/edit`)}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                Editar
              </button>
              <button
                onClick={() => handleDelete(user.id)}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {user.active ? "Desativar" : "Excluir"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
