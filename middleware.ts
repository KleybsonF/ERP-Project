import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "./app/lib/auth";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isPublicRoute = path === "/login" || path.startsWith("/_next") || path.startsWith("/favicon");
  
  if (isPublicRoute) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get("session")?.value;
  
  let session = null;
  if (cookie) {
    try {
      session = await decrypt(cookie);
    } catch(e) {
      // invalid token
    }
  }

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  const role = session.role; // Administrador, Financeiro, Gestor, Operador

  // Access Control Logic
  if (path === "/" && role === "Operador") {
    return NextResponse.redirect(new URL("/minhas-ocorrencias", request.nextUrl));
  }
  
  if (path.startsWith("/financeiro") && role !== "Administrador" && role !== "Financeiro") {
    return NextResponse.redirect(new URL("/", request.nextUrl));
  }

  if (path.startsWith("/equipe") && role === "Operador") {
    return NextResponse.redirect(new URL("/", request.nextUrl)); // Operador não vê equipe
  }

  if (path.startsWith("/clientes") && role === "Operador") {
    return NextResponse.redirect(new URL("/", request.nextUrl)); // Operador não vê lista de clientes (vê só na ocorrência)
  }

  if ((path.startsWith("/ocorrencias") || path.startsWith("/os")) && role === "Operador") {
    return NextResponse.redirect(new URL("/minhas-ocorrencias", request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
