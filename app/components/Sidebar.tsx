"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Wrench, 
  Users, 
  Wallet, 
  Settings, 
  LogOut,
  BarChart2,
  MapPin,
  ChevronDown,
  ChevronRight,
  AlertTriangle
} from "lucide-react";
import { logout } from "@/app/actions/auth";
import { useState } from "react";

export default function Sidebar({ role, email }: { role: string; email: string }) {
  const pathname = usePathname();
  const [isReportsOpen, setIsReportsOpen] = useState(pathname.startsWith("/relatorios"));

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["Administrador", "Gestor", "Financeiro"] },
    { href: "/os", label: "Gestão de O.S.", icon: Wrench, roles: ["Administrador", "Gestor"] },
    { href: "/minhas-os", label: "Minhas O.S.", icon: Wrench, roles: ["Operador"] },
    { href: "/clientes", label: "Clientes", icon: Users, roles: ["Administrador", "Gestor", "Financeiro"] },
    { href: "/financeiro", label: "Financeiro", icon: Wallet, roles: ["Administrador", "Financeiro"] },
    { href: "/usuarios", label: "Equipe & Acessos", icon: Settings, roles: ["Administrador", "Gestor"] },
  ];

  const visibleLinks = links.filter(link => link.roles.includes(role));

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div style={{ background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))', borderRadius: '8px', padding: '6px' }}>
          <LayoutDashboard size={24} color="white" />
        </div>
        Premium ERP
      </div>
      
      <div className="sidebar-user">
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Logado como</div>
        <div style={{ marginTop: '2px', color: 'white' }}>{email}</div>
        <div style={{ fontSize: '12px', marginTop: '4px' }}>
          <span className="badge badge-neutral" style={{ padding: '2px 8px', fontSize: '10px' }}>{role}</span>
        </div>
      </div>

      <nav className="nav-links">
        {visibleLinks.map(link => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link key={link.href} href={link.href} className={`nav-item ${isActive ? "active" : ""}`}>
              <Icon size={18} />
              {link.label}
            </Link>
          );
        })}

        {["Administrador", "Gestor", "Financeiro"].includes(role) && (
          <div>
            <div 
              className={`nav-item ${pathname.startsWith("/relatorios") ? "active" : ""}`} 
              onClick={() => setIsReportsOpen(!isReportsOpen)}
              style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <BarChart2 size={18} />
                Relatórios
              </div>
              {isReportsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
            {isReportsOpen && (
              <div style={{ paddingLeft: '30px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <Link 
                  href="/relatorios/fluxo-caixa" 
                  className={`nav-item ${pathname === "/relatorios/fluxo-caixa" ? "active" : ""}`}
                  style={{ fontSize: '14px', padding: '8px 12px' }}
                >
                  <Wallet size={16} /> Fluxo de Caixa
                </Link>
                <Link 
                  href="/relatorios/desempenho-tecnicos" 
                  className={`nav-item ${pathname === "/relatorios/desempenho-tecnicos" ? "active" : ""}`}
                  style={{ fontSize: '14px', padding: '8px 12px' }}
                >
                  <Users size={16} /> Desempenho (Técnicos)
                </Link>
                <Link 
                  href="/relatorios/mapa-os" 
                  className={`nav-item ${pathname === "/relatorios/mapa-os" ? "active" : ""}`}
                  style={{ fontSize: '14px', padding: '8px 12px' }}
                >
                  <MapPin size={16} /> Mapa de O.S.
                </Link>
                <Link 
                  href="/relatorios/vencimento-anvisa" 
                  className={`nav-item ${pathname === "/relatorios/vencimento-anvisa" ? "active" : ""}`}
                  style={{ fontSize: '14px', padding: '8px 12px' }}
                >
                  <AlertTriangle size={16} /> Vencimento Anvisa
                </Link>
                <Link 
                  href="/relatorios/logs-sistema" 
                  className={`nav-item ${pathname === "/relatorios/logs-sistema" ? "active" : ""}`}
                  style={{ fontSize: '14px', padding: '8px 12px' }}
                >
                  <BarChart2 size={16} /> Logs do Sistema
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>

      <form action={logout} style={{ marginTop: 'auto' }}>
        <button type="submit" className="btn-danger" style={{ width: '100%' }}>
          <LogOut size={18} />
          Sair do Sistema
        </button>
      </form>
    </aside>
  );
}
