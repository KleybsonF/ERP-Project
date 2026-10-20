"use client";

import { useState } from "react";
import { updateUser } from "@/app/actions/usuarios";
import { Phone, Briefcase, ArrowLeft, Eye, EyeOff, Mail, Lock, User as UserIcon, Check, AtSign, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatPhone } from "@/app/lib/utils";
import AdminNavTabs from "@/app/components/AdminNavTabs";
import PermissionsMatrix from "@/app/components/PermissionsMatrix";
import { parseUserPermissions } from "@/app/lib/permissions";

export default function EditarUsuarioClient({ user }: { user: any }) {
  const router = useRouter();
  const [login, setLogin] = useState(user.username || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState(user.employee?.name || "");
  const [cargo, setCargo] = useState(user.employee?.cargo || "");
  const [email, setEmail] = useState(user.email || "");
  const [numero, setNumero] = useState(formatPhone(user.employee?.phone || ""));
  const [role, setRole] = useState(user.role || "Operador");
  const [permissions, setPermissions] = useState<string[]>(() =>
    parseUserPermissions(user.role, user.permissions)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsSubmitting(true);

    try {
      const res = await updateUser(user.id, {
        login: login.trim().toLowerCase(),
        password: password.trim() || undefined,
        name: name.trim(),
        cargo: cargo.trim() || "Colaborador",
        email: email.trim(),
        numero: numero.trim(),
        role,
        permissions
      });

      if (!res.success) {
        throw new Error(res.error || "Erro ao atualizar usuário.");
      }

      router.push("/usuarios");
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao salvar.");
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 16px" }}>
      {/* Breadcrumbs e Título */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
        <button onClick={() => router.back()} className="btn-secondary" style={{ padding: "10px", borderRadius: "10px" }} title="Voltar">
          <ArrowLeft size={20} />
        </button>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-secondary)", marginBottom: "4px" }}>
            <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>Início</Link>
            <span>/</span>
            <Link href="/usuarios" style={{ color: "inherit", textDecoration: "none" }}>Administração</Link>
            <span>/</span>
            <span style={{ color: "var(--text-main)", fontWeight: 500 }}>Editar Usuário</span>
          </div>
          <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 700, color: "var(--text-main)" }}>
            Editar: {user.employee?.name || user.username}
          </h1>
          <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "var(--text-secondary)" }}>
            Atualize dados cadastrais, credenciais e matriz de permissões deste usuário.
          </p>
        </div>
      </div>

      <AdminNavTabs />

      {errorMsg && (
        <div style={{ padding: "14px 18px", borderRadius: "10px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#ef4444", fontSize: "14px", marginBottom: "24px" }}>
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Seção 1: Perfil Pessoal */}
        <div className="glass-panel" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", paddingBottom: "14px", borderBottom: "1px solid var(--glass-border)" }}>
            <div style={{ padding: "8px", background: "rgba(99, 102, 241, 0.12)", borderRadius: "8px", color: "#6366f1" }}>
              <UserIcon size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "var(--text-main)" }}>Dados Pessoais e Contato</h3>
              <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>Identificação do funcionário na empresa</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "18px" }}>
            <div className="input-group">
              <label>Nome Completo *</label>
              <div style={{ position: "relative" }}>
                <UserIcon size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input placeholder="Ex: João da Silva" value={name} onChange={(e) => setName(e.target.value)} required style={{ paddingLeft: "40px" }} className="input-field" />
              </div>
            </div>

            <div className="input-group">
              <label>E-mail Corporativo *</label>
              <div style={{ position: "relative" }}>
                <Mail size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input type="email" placeholder="joao@empresa.com" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ paddingLeft: "40px" }} className="input-field" />
              </div>
            </div>

            <div className="input-group">
              <label>Cargo / Função</label>
              <div style={{ position: "relative" }}>
                <Briefcase size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input placeholder="Ex: Técnico Sr" value={cargo} onChange={(e) => setCargo(e.target.value)} style={{ paddingLeft: "40px" }} className="input-field" />
              </div>
            </div>

            <div className="input-group">
              <label>WhatsApp / Telefone</label>
              <div style={{ position: "relative" }}>
                <Phone size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input placeholder="(11) 90000-0000" value={numero} onChange={(e) => setNumero(formatPhone(e.target.value))} style={{ paddingLeft: "40px" }} className="input-field" />
              </div>
            </div>
          </div>
        </div>

        {/* Seção 2: Credenciais */}
        <div className="glass-panel" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", paddingBottom: "14px", borderBottom: "1px solid var(--glass-border)" }}>
            <div style={{ padding: "8px", background: "rgba(139, 92, 246, 0.12)", borderRadius: "8px", color: "#8b5cf6" }}>
              <Lock size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "var(--text-main)" }}>Credenciais de Login</h3>
              <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>Login de acesso e alteração de senha</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "18px" }}>
            <div className="input-group">
              <label>Login de Usuário (@username) *</label>
              <div style={{ position: "relative" }}>
                <AtSign size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input value={login} onChange={(e) => setLogin(e.target.value.toLowerCase().replace(/\s+/g, ""))} required style={{ paddingLeft: "40px" }} className="input-field" />
              </div>
            </div>

            <div className="input-group">
              <label>Nova Senha (deixe em branco para manter a atual)</label>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} style={{ paddingLeft: "40px", paddingRight: "44px" }} className="input-field" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Seção 3: Permissões Granulares */}
        <div className="glass-panel" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", paddingBottom: "14px", borderBottom: "1px solid var(--glass-border)" }}>
            <div style={{ padding: "8px", background: "rgba(16, 185, 129, 0.12)", borderRadius: "8px", color: "#10b981" }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "var(--text-main)" }}>Permissões & Níveis de Acesso</h3>
              <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>Selecione o cargo base e personalize cada permissão individual</p>
            </div>
          </div>

          <PermissionsMatrix
            selectedRole={role}
            onRoleChange={(newRole) => setRole(newRole)}
            selectedPermissions={permissions}
            onPermissionsChange={(newPerms) => setPermissions(newPerms)}
            disabled={isSubmitting}
          />
        </div>

        {/* Botão de Envio */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
          <button type="button" onClick={() => router.back()} className="btn-secondary" disabled={isSubmitting}>
            Cancelar
          </button>
          <button className="btn btn-primary" type="submit" disabled={isSubmitting} style={{ padding: "12px 32px", fontSize: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
            {isSubmitting ? "Salvando..." : <><Check size={18} /> Salvar Alterações de Acesso</>}
          </button>
        </div>
      </form>
    </div>
  );
}
