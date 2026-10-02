"use server";

import { PrismaClient } from "@prisma/client";
import { encrypt, getSession } from "@/app/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Auto-seed admin if no users exist
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    const hash = await bcrypt.hash("123456", 10);
    await prisma.user.create({
      data: {
        email: "admin@admin.com",
        password: hash,
        role: "Administrador"
      }
    });
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: email },
        { username: email } // if they typed their username in the email field
      ]
    }
  });

  if (!user) {
    return { error: "Credenciais inválidas." };
  }

  const pwMatch = await bcrypt.compare(password, user.password);
  if (!pwMatch) {
    return { error: "Credenciais inválidas." };
  }

  const expires = new Date(Date.now() + 8 * 60 * 60 * 1000);
  const session = await encrypt({ userId: user.id, role: user.role, email: user.email, employeeId: user.employeeId, expires });

  const cookieStore = await cookies();
  cookieStore.set("session", session, { expires, httpOnly: true });

  await prisma.systemLog.create({
    data: {
      userId: user.id,
      action: "LOGIN",
      resource: "Autenticação",
      details: "Sessão iniciada"
    }
  });

  redirect("/");
}

export async function logout() {
  const session = await getSession();
  if (session?.userId) {
    await prisma.systemLog.create({
      data: {
        userId: session.userId,
        action: "LOGOUT",
        resource: "Autenticação",
        details: "Sessão encerrada"
      }
    });
  }
  
  const cookieStore = await cookies();
  cookieStore.set("session", "", { expires: new Date(0) });
  redirect("/login");
}
