import logo from "../../assets/logo.png"; // Ajuste o caminho conforme necessário

export default function Header() {
  return (
    <header className="bg-white shadow-sm p-4 sticky top-0 z-10">
      <div className="flex items-center justify-between">
        <img src={logo} alt="Retrato Pesquisas" className="h-8 w-auto" />
        <button className="text-gray-600">
          {/* Ícone de menu ou perfil */}☰
        </button>
      </div>
    </header>
  );
}
