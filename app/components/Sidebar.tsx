"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LogOut,
  ChevronDown,
  Star,
  Bell,
  Search,
  User as UserIcon,
  Sun,
  Moon
} from "lucide-react";
import { logout } from "@/app/actions/auth";
import { useState, useEffect } from "react";

export default function Topbar({ role, email }: { role: string; email: string }) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<"dark" | "light">("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme as "dark" | "light");
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const links = [
    { 
      label: "Clientes", 
      roles: ["Administrador", "Gestor", "Financeiro"],
      subLinks: [
        { href: "/clientes", label: "Lista de Clientes" },
        { href: "/clientes/novo", label: "Cadastrar Cliente" }
      ]
    },
    { 
      label: "Financeiro", 
      roles: ["Administrador", "Financeiro"],
      subLinks: [
        { href: "/financeiro", label: "Painel Financeiro" },
        { href: "/financeiro/receitas", label: "Contas a Receber" },
        { href: "/financeiro/despesas", label: "Contas a Pagar" }
      ]
    },
    { 
      label: "Estoque / OS", 
      roles: ["Administrador", "Gestor"],
      subLinks: [
        { href: "/os", label: "Gestão de OS" },
        { href: "/os/nova", label: "Nova Ocorrência" }
      ]
    },
    { 
      href: "/minhas-os", 
      label: "Minhas OS", 
      roles: ["Operador"] 
    },
    { 
      label: "Relatórios", 
      roles: ["Administrador", "Gestor", "Financeiro"],
      subLinks: [
        { href: "/relatorios/fluxo-caixa", label: "Fluxo de Caixa" },
        { href: "/relatorios/desempenho-tecnicos", label: "Desempenho" },
        { href: "/relatorios/mapa-os", label: "Mapa de Ocorrências" },
        { href: "/relatorios/vencimento-anvisa", label: "Vencimento Anvisa" },
        { href: "/relatorios/logs-sistema", label: "Logs do Sistema" }
      ]
    },
    { 
      label: "Administração", 
      roles: ["Administrador", "Gestor"],
      subLinks: [
        { href: "/usuarios", label: "Equipe e Acessos" }
      ]
    },
  ];

  const visibleLinks = links.filter(link => link.roles.includes(role));

  return (
    <header className="topbar">
      <div className="topbar-header">
        <div className="topbar-left">
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div className="topbar-logo">
              <span className="logo-text">KFX</span>
            </div>
          </Link>
          
          <div className="search-container">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Consultar Cliente" 
              className="search-input"
            />
            <div className="search-divider"></div>
            <select className="search-select">
              <option value="all">Tipo</option>
              <option value="nome">Nome / Razão Social</option>
              <option value="id">ID Cliente</option>
              <option value="cpf_cnpj">CPF / CNPJ</option>
              <option value="telefone">Telefone</option>
              <option value="email">E-mail</option>
              <option value="rua">Rua</option>
              <option value="ocorrencia">Ocorrência</option>
              <option value="os">Ordem de Serviço</option>
              <option value="tag">Tag</option>
            </select>
          </div>
        </div>
        
        <div className="topbar-right">
          <div className="topbar-actions">
            <button className="icon-btn"><Star size={18} /></button>
            <button className="icon-btn"><Bell size={18} /><span className="badge-indicator"></span></button>
          </div>
          
          <div className="topbar-profile-section">
            <div className="info-block">
              <span className="info-label">Empresa</span>
              <span className="info-value text-primary">{process.env.NEXT_PUBLIC_COMPANY_NAME || "KFX Tech"}</span>
            </div>
            
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                transition: 'background 0.2s',
                marginRight: '8px'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--glass-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              title={`Mudar para tema ${theme === 'dark' ? 'claro' : 'escuro'}`}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="info-block">
              <span className="info-label">Usuário</span>
              <span className="info-value">{email.split('@')[0]}</span>
            </div>

            <div className="avatar-circle">
              <UserIcon size={16} />
            </div>
            
            <form action={logout}>
              <button type="submit" className="logout-btn" title="Sair do Sistema">
                <LogOut size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>

      <nav className="topbar-nav">
        <div className="nav-container">
          {visibleLinks.map(link => {
            const isDropdown = !!link.subLinks;
            const isActive = link.href 
              ? pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
              : link.subLinks?.some(sub => pathname === sub.href || pathname.startsWith(sub.href));

            return (
              <div key={link.label} className="nav-item-wrapper">
                {isDropdown ? (
                  <div className={`nav-item ${isActive ? "active" : ""}`}>
                    {link.label}
                    <ChevronDown size={14} className="nav-chevron" />
                    {isActive && <div className="nav-active-indicator" />}
                  </div>
                ) : (
                  <Link href={link.href!} className={`nav-item ${isActive ? "active" : ""}`}>
                    {link.label}
                    {isActive && <div className="nav-active-indicator" />}
                  </Link>
                )}
                
                {isDropdown && (
                  <div className="dropdown-menu">
                    <div className="dropdown-content">
                      {link.subLinks!.map(sub => (
                        <Link key={sub.href} href={sub.href} className="dropdown-item">
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
