import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cookies } from "next/headers";
import { decrypt } from "@/app/lib/auth";
import Topbar from "@/app/components/Sidebar";
import { LogOut } from "lucide-react";
import { logout } from "@/app/actions/auth";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "KFX ERP",
  description: "ERP Estrito - KFX Style",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;
  
  let role = null;
  let email = null;
  
  if (sessionToken) {
    try {
      const parsed = await decrypt(sessionToken);
      role = parsed.role;
      email = parsed.email;
    } catch(e) {}
  }

  const isAuth = !!role;
  const isOperador = role === "Operador";

  return (
    <html lang="pt-BR" className={inter.className}>
      <body>
        <div className="app-layout">
          {isAuth && !isOperador && (
            <Topbar role={role} email={email} />
          )}
          <main className="main-content" style={{ padding: isOperador ? '0 16px 32px 16px' : undefined }}>
            {isAuth && isOperador && (
              <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--glass-border)', marginBottom: '24px' }}>
                <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '18px' }}>
                  <span style={{ color: 'var(--primary-color)' }}>KFX</span> ERP
                </div>
                <form action={logout}>
                  <button type="submit" className="btn-danger" style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', border: 'none' }}>
                    <LogOut size={14} /> Sair
                  </button>
                </form>
              </header>
            )}
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
