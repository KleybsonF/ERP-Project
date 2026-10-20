"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Building2, 
  Truck, 
  ShieldAlert, 
  Users 
} from "lucide-react";

export default function AdminNavTabs() {
  const pathname = usePathname();

  const tabs = [
    { href: "/administracao/dashboards", label: "Dashboards", icon: LayoutDashboard },
    { href: "/administracao/empresa", label: "Empresa & Filiais", icon: Building2 },
    { href: "/administracao/veiculos", label: "Veículos da Frota", icon: Truck },
    { href: "/administracao/blacklist", label: "Blacklist", icon: ShieldAlert },
    { href: "/usuarios", label: "Equipe & Acessos", icon: Users },
  ];

  return (
    <div 
      style={{ 
        display: "flex", 
        gap: "8px", 
        borderBottom: "1px solid var(--glass-border)", 
        paddingBottom: "12px", 
        marginBottom: "24px", 
        flexWrap: "wrap",
        alignItems: "center"
      }}
    >
      {tabs.map((tab) => {
        const isActive = pathname === tab.href || (tab.href === "/usuarios" && pathname.startsWith("/usuarios"));
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "9px 18px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: isActive ? 700 : 500,
              textDecoration: "none",
              background: isActive ? "rgba(99, 102, 241, 0.15)" : "rgba(255, 255, 255, 0.03)",
              color: isActive ? "#6366f1" : "var(--text-secondary)",
              border: isActive ? "1px solid rgba(99, 102, 241, 0.35)" : "1px solid var(--glass-border)",
              boxShadow: isActive ? "0 2px 8px rgba(99, 102, 241, 0.12)" : "none",
              transition: "all 0.2s ease"
            }}
          >
            <Icon size={16} />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
