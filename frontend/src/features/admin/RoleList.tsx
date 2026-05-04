import { useNavigate } from "react-router-dom";
import { useGetRolesQuery, useDeleteRoleMutation } from "./adminApi";
import { toast } from "sonner";

export default function RoleList() {
  const { data: roles, isLoading } = useGetRolesQuery();
  const [deleteRole] = useDeleteRoleMutation();
  const navigate = useNavigate();

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta role?")) return;
    try {
      await deleteRole(id).unwrap();
      toast.success("Role excluída.");
    } catch {
      toast.error("Erro ao excluir role. Verifique se há usuários associados.");
    }
  };

  if (isLoading) return <div className="p-4">Carregando roles...</div>;

  return (
    <div className="p-4 pb-20">
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => navigate(-1)} className="text-blue-600">
          ← Voltar
        </button>
        <h1 className="text-xl font-bold">Roles</h1>
        <button
          onClick={() => navigate("/admin/roles/new")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Nova Role
        </button>
      </div>
      <div className="space-y-3">
        {roles?.map((role) => (
          <div
            key={role.id}
            className="bg-white p-4 rounded-lg shadow-sm flex justify-between items-center"
          >
            <div>
              <p className="font-medium">{role.name}</p>
              <p className="text-sm text-gray-500">
                {role.permissions?.length ?? 0} permissões
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/admin/roles/${role.id}/edit`)}
                className="text-blue-600 hover:underline text-sm"
              >
                Editar
              </button>
              <button
                onClick={() => handleDelete(role.id)}
                className="text-red-600 hover:underline text-sm"
              >
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
