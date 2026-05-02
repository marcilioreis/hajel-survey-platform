import { useState } from "react";
import { useAppSelector } from "../../app/hooks";
import { useUpdateUserMutation, useChangePasswordMutation } from "./authApi";
import { toast } from "sonner";

export default function Profile() {
  const user = useAppSelector((state) => state.auth.user);
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [changePassword, { isLoading: isChanging }] =
    useChangePasswordMutation();

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUser({ name, email }).unwrap();
      toast.success("Perfil atualizado.");
    } catch {
      toast.error("Erro ao atualizar.");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await changePassword({ currentPassword, newPassword }).unwrap();
      toast.success("Senha alterada.");
      setCurrentPassword("");
      setNewPassword("");
    } catch {
      toast.error("Erro ao alterar a senha.");
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      <h1 className="text-xl font-bold">Meu Perfil</h1>
      <form onSubmit={handleUpdateProfile} className="space-y-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 border rounded-lg"
          placeholder="Nome"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 border rounded-lg"
          placeholder="E‑mail"
        />
        <button
          type="submit"
          disabled={isUpdating}
          className="w-full py-3 bg-blue-600 text-white rounded-lg disabled:opacity-50"
        >
          {isUpdating ? "Salvando..." : "Atualizar perfil"}
        </button>
      </form>

      <hr />

      <h2 className="text-lg font-semibold">Alterar senha</h2>
      <form onSubmit={handleChangePassword} className="space-y-4">
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="w-full p-3 border rounded-lg"
          placeholder="Senha atual"
          required
        />
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full p-3 border rounded-lg"
          placeholder="Nova senha"
          required
        />
        <button
          type="submit"
          disabled={isChanging}
          className="w-full py-3 bg-blue-600 text-white rounded-lg disabled:opacity-50"
        >
          {isChanging ? "Alterando..." : "Alterar senha"}
        </button>
      </form>
    </div>
  );
}
