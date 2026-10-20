"use client";

import React from "react";
import { 
  Users, 
  ClipboardCheck, 
  Wallet, 
  Package, 
  BarChart3, 
  Settings, 
  Check, 
  X, 
  ShieldCheck, 
  Info,
  CheckSquare,
  Square
} from "lucide-react";
import { 
  PERMISSION_MODULES, 
  ALL_PERMISSION_IDS, 
  ROLE_PRESETS, 
  AVAILABLE_ROLES 
} from "@/app/lib/permissions";

interface PermissionsMatrixProps {
  selectedRole: string;
  onRoleChange: (role: string) => void;
  selectedPermissions: string[];
  onPermissionsChange: (perms: string[]) => void;
  disabled?: boolean;
}

export default function PermissionsMatrix({
  selectedRole,
  onRoleChange,
  selectedPermissions,
  onPermissionsChange,
  disabled = false
}: PermissionsMatrixProps) {

  const handleRoleSelect = (newRole: string) => {
    onRoleChange(newRole);
    const preset = ROLE_PRESETS[newRole] || [];
    onPermissionsChange([...preset]);
  };

  const handleTogglePermission = (permId: string) => {
    if (disabled) return;
    if (selectedPermissions.includes(permId)) {
      onPermissionsChange(selectedPermissions.filter((id) => id !== permId));
    } else {
      onPermissionsChange([...selectedPermissions, permId]);
    }
  };

  const handleSelectAll = () => {
    if (disabled) return;
    onPermissionsChange([...ALL_PERMISSION_IDS]);
  };

  const handleDeselectAll = () => {
    if (disabled) return;
    onPermissionsChange([]);
  };

  const handleToggleModule = (modulePermIds: string[]) => {
    if (disabled) return;
    const allChecked = modulePermIds.every((id) => selectedPermissions.includes(id));
    if (allChecked) {
      // Uncheck all in this module
      onPermissionsChange(selectedPermissions.filter((id) => !modulePermIds.includes(id)));
    } else {
      // Check all in this module
      const toAdd = modulePermIds.filter((id) => !selectedPermissions.includes(id));
      onPermissionsChange([...selectedPermissions, ...toAdd]);
    }
  };

  const getModuleIcon = (iconName: string) => {
    switch (iconName) {
      case "Users":
        return <Users size={18} color="#38bdf8" />;
      case "ClipboardCheck":
        return <ClipboardCheck size={18} color="#a855f7" />;
      case "Wallet":
        return <Wallet size={18} color="#10b981" />;
      case "Package":
        return <Package size={18} color="#f59e0b" />;
      case "BarChart3":
        return <BarChart3 size={18} color="#ec4899" />;
      case "Settings":
      default:
        return <Settings size={18} color="#6366f1" />;
    }
  };

  const totalCount = ALL_PERMISSION_IDS.length;
  const activeCount = selectedPermissions.length;
  const percent = Math.round((activeCount / totalCount) * 100);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* 1. SELETOR DE PERFIL / CARGO BASE */}
      <div 
        style={{ 
          background: "rgba(255, 255, 255, 0.02)", 
          border: "1px solid var(--glass-border)", 
          borderRadius: "14px", 
          padding: "20px" 
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "14px" }}>
          <div>
            <label style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
              <ShieldCheck size={18} color="var(--primary-color)" /> Perfil de Acesso Base (Cargo)
            </label>
            <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>
              Ao selecionar um cargo, as permissões recomendadas são pré-marcadas automaticamente. Você pode ajustar livremente cada caixinha abaixo.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              type="button"
              onClick={handleSelectAll}
              disabled={disabled}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                background: "rgba(99, 102, 241, 0.12)",
                color: "#6366f1",
                border: "1px solid rgba(99, 102, 241, 0.3)",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              <CheckSquare size={13} /> Marcar Todas
            </button>
            <button
              type="button"
              onClick={handleDeselectAll}
              disabled={disabled}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                background: "rgba(239, 68, 68, 0.1)",
                color: "#ef4444",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              <Square size={13} /> Desmarcar Todas
            </button>
          </div>
        </div>

        {/* Botoes de selecao rapida de cargos */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px" }}>
          {AVAILABLE_ROLES.map((role) => {
            const isSelected = selectedRole === role.value;
            return (
              <button
                key={role.value}
                type="button"
                onClick={() => handleRoleSelect(role.value)}
                disabled={disabled}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "4px",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: isSelected ? `2px solid ${role.color}` : "1px solid var(--glass-border)",
                  background: isSelected ? role.badgeBg : "rgba(255, 255, 255, 0.02)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s ease"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                  <span style={{ fontSize: "13px", fontWeight: isSelected ? 700 : 600, color: isSelected ? role.color : "var(--text-main)" }}>
                    {role.value}
                  </span>
                  {isSelected && <Check size={14} color={role.color} />}
                </div>
                <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                  {role.value === "Administrador" && "Acesso Total"}
                  {role.value === "Gestor" && "Operação & Clientes"}
                  {role.value === "Financeiro" && "Contas & Caixas"}
                  {role.value === "Operador" && "Execução de Campo"}
                  {role.value === "Atendente" && "Comercial / SAC"}
                  {role.value === "Sem Acesso" && "Acesso Bloqueado"}
                </span>
              </button>
            );
          })}
        </div>

        {/* Barra de progresso de permissoes */}
        <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid var(--glass-border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--text-secondary)" }}>
            <Info size={14} />
            <span>Permissões concedidas neste usuário:</span>
            <strong style={{ color: "var(--text-main)", fontSize: "13px" }}>{activeCount} de {totalCount} ({percent}%)</strong>
          </div>
          <div style={{ flex: 1, maxWidth: "200px", height: "6px", background: "rgba(255, 255, 255, 0.08)", borderRadius: "3px", overflow: "hidden" }}>
            <div 
              style={{ 
                width: `${percent}%`, 
                height: "100%", 
                background: percent > 80 ? "linear-gradient(90deg, #6366f1, #38bdf8)" : percent > 40 ? "#10b981" : "#f59e0b",
                borderRadius: "3px",
                transition: "width 0.3s ease"
              }} 
            />
          </div>
        </div>
      </div>

      {/* 2. MATRIZ DE MÓDULOS E CAIXINHAS INDIVIDUAIS */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {PERMISSION_MODULES.map((module) => {
          const modulePermIds = module.permissions.map((p) => p.id);
          const checkedCount = modulePermIds.filter((id) => selectedPermissions.includes(id)).length;
          const isAllModuleChecked = checkedCount === modulePermIds.length;
          const isSomeModuleChecked = checkedCount > 0 && !isAllModuleChecked;

          return (
            <div
              key={module.id}
              style={{
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid var(--glass-border)",
                borderRadius: "14px",
                overflow: "hidden",
                transition: "all 0.2s ease"
              }}
            >
              {/* Module Header */}
              <div
                style={{
                  padding: "14px 18px",
                  background: "rgba(255, 255, 255, 0.03)",
                  borderBottom: "1px solid var(--glass-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  flexWrap: "wrap"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      background: "rgba(255, 255, 255, 0.05)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    {getModuleIcon(module.iconName)}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-main)" }}>
                        {module.name}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: "12px",
                          background: isAllModuleChecked
                            ? "rgba(16, 185, 129, 0.15)"
                            : isSomeModuleChecked
                            ? "rgba(56, 189, 248, 0.15)"
                            : "rgba(255, 255, 255, 0.05)",
                          color: isAllModuleChecked ? "#10b981" : isSomeModuleChecked ? "#38bdf8" : "var(--text-secondary)",
                          border: isAllModuleChecked
                            ? "1px solid rgba(16, 185, 129, 0.3)"
                            : isSomeModuleChecked
                            ? "1px solid rgba(56, 189, 248, 0.3)"
                            : "1px solid var(--glass-border)"
                        }}
                      >
                        {checkedCount}/{modulePermIds.length} ativas
                      </span>
                    </div>
                    <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "var(--text-secondary)" }}>
                      {module.description}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleModule(modulePermIds)}
                  disabled={disabled}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "5px 12px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: 600,
                    background: "transparent",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--glass-border)",
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  {isAllModuleChecked ? (
                    <>
                      <X size={12} /> Desmarcar Módulo
                    </>
                  ) : (
                    <>
                      <Check size={12} /> Marcar Todos do Módulo
                    </>
                  )}
                </button>
              </div>

              {/* Module Checkboxes Grid */}
              <div
                style={{
                  padding: "16px 18px",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "12px"
                }}
              >
                {module.permissions.map((perm) => {
                  const isChecked = selectedPermissions.includes(perm.id);

                  return (
                    <label
                      key={perm.id}
                      onClick={(e) => {
                        e.preventDefault();
                        handleTogglePermission(perm.id);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        background: isChecked ? "rgba(99, 102, 241, 0.08)" : "rgba(255, 255, 255, 0.015)",
                        border: isChecked ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid rgba(255, 255, 255, 0.05)",
                        cursor: disabled ? "default" : "pointer",
                        userSelect: "none",
                        transition: "all 0.15s ease"
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // handled by parent label click
                        disabled={disabled}
                        style={{
                          width: "18px",
                          height: "18px",
                          marginTop: "2px",
                          accentColor: "#6366f1",
                          cursor: disabled ? "default" : "pointer",
                          flexShrink: 0
                        }}
                      />
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span style={{ fontSize: "13px", fontWeight: isChecked ? 600 : 500, color: isChecked ? "var(--text-main)" : "var(--text-secondary)" }}>
                          {perm.label}
                        </span>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.3 }}>
                          {perm.description}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
