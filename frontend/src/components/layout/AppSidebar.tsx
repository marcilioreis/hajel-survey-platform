import { NavLink } from "react-router-dom";
import { useAppSelector } from "@/app/hooks";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import logo from "@/assets/logo.png";
import {
  ClipboardList,
  BarChart3,
  Shield,
  MapPin,
  Settings,
} from "lucide-react";

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function AppSidebar({ onClose }: SidebarProps) {
  const { user, roles, permissions } = useAppSelector((state) => state.auth);

  const isAdmin =
    roles.includes("admin") || permissions.includes("admin:access");

  const links = [
    { to: "/surveys", label: "Pesquisas", icon: ClipboardList },
    { to: "/reports", label: "Relatórios", icon: BarChart3 },
    { to: "/locations", label: "Locais", icon: MapPin },
    { to: "/admin", label: "Admin", icon: Shield, adminOnly: true },
    { to: "/profile", label: "Perfil", icon: Settings },
  ];

  const filteredLinks = links.filter((link) => !link.adminOnly || isAdmin);

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full py-4">
      <div className="px-4 mb-4">
        <h2 className="inline-flex tracking-tight">
          <img src={logo} alt="Retrato" className="h-8 w-auto" />
        </h2>
        <p className="text-xs text-muted-foreground">Painel de Pesquisas</p>
      </div>
      <Separator />
      <nav className="flex-1 space-y-1 p-2">
        {filteredLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={handleLinkClick}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )
            }
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </NavLink>
        ))}
      </nav>
      <Separator />
      <div className="p-4">
        <p className="text-xs text-muted-foreground">
          Logado como {user?.name ?? "Usuário"}
        </p>
        {user?.email && (
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        )}
      </div>
    </div>
  );

  // Em telas grandes (md+), renderizamos uma sidebar fixa.
  // Em mobile, o conteúdo é usado diretamente pelo Sheet (que é controlado no Header).
  return (
    <>
      <aside className="hidden md:flex md:w-64 md:flex-col border-r bg-background h-screen">
        {sidebarContent}
      </aside>
      <div className="md:hidden">{sidebarContent}</div>
    </>
  );
}
