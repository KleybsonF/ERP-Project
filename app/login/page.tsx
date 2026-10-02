"use client";

import { useState } from "react";
import { login } from "@/app/actions/auth";
import { Lock, Mail, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await login(formData);
    if (res?.error) {
      setError(res.error);
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-color)', position: 'relative', overflow: 'hidden' }}>
      
      {/* Elementos Decorativos de Fundo */}
      <div style={{ position: 'absolute', width: '500px', height: '500px', background: 'var(--primary-glow)', borderRadius: '50%', filter: 'blur(100px)', top: '-10%', left: '-10%', zIndex: 0 }} />
      <div style={{ position: 'absolute', width: '400px', height: '400px', background: 'rgba(139, 92, 246, 0.2)', borderRadius: '50%', filter: 'blur(80px)', bottom: '-10%', right: '-5%', zIndex: 0 }} />

      <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '48px', display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '420px', zIndex: 10, position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '800', background: 'linear-gradient(to right, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>
            Premium ERP
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Entre com suas credenciais para continuar.
          </p>
        </div>

        {error && (
          <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '12px', borderRadius: '8px', fontSize: '13px', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.2)', fontWeight: 500 }}>
            {error}
          </div>
        )}

        <div className="input-group">
          <label>Email ou Usuário</label>
          <div style={{ position: 'relative' }}>
            <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input name="email" type="text" placeholder="admin@admin.com" required style={{ paddingLeft: '40px' }} />
          </div>
        </div>

        <div className="input-group">
          <label>Senha</label>
          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input name="password" type="password" placeholder="••••••••" required style={{ paddingLeft: '40px' }} />
          </div>
        </div>
        
        <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '14px', fontSize: '15px', marginTop: '12px' }}>
          {loading ? "Autenticando..." : "Entrar no Sistema"}
          {!loading && <ArrowRight size={18} />}
        </button>

        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
          Acesso Seguro & Criptografado
        </div>
      </form>
    </div>
  );
}
