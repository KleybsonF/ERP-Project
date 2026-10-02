"use server";
import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function getUsers() {
  return await prisma.user.findMany({
    include: { employee: true },
    orderBy: { id: "asc" },
  });
}

export async function createUser(data: { login: string; email: string; password: string; name: string; cargo: string; numero: string; permissions: string }) {
  // O usuário pediu pra criar as duas coisas juntas numa tela unificada de usuário
  const emp = await prisma.employee.create({
    data: {
      name: data.name,
      cargo: data.cargo,
      phone: data.numero,
      status: "Ativo"
    }
  });

  const hash = await bcrypt.hash(data.password, 10);
  await prisma.user.create({
    data: {
      username: data.login,
      email: data.email,
      password: hash,
      role: data.permissions,
      employeeId: emp.id
    }
  });

  revalidatePath("/usuarios");
}

export async function hideUser(id: number) {
  await prisma.user.update({
    where: { id },
    data: { ativo: false }
  });
  revalidatePath("/usuarios");
}

export async function restoreUser(id: number) {
  await prisma.user.update({
    where: { id },
    data: { ativo: true }
  });
  revalidatePath("/usuarios");
}

export async function getUser(id: number) {
  return await prisma.user.findUnique({
    where: { id },
    include: { employee: true }
  });
}

export async function updateUser(id: number, data: { login: string; email: string; password?: string; name: string; cargo: string; numero: string; permissions: string }) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return;
  
  if (user.employeeId) {
    await prisma.employee.update({
      where: { id: user.employeeId },
      data: {
        name: data.name,
        cargo: data.cargo,
        phone: data.numero,
      }
    });
  }

  const updateData: any = {
    username: data.login,
    email: data.email,
    role: data.permissions,
  };

  if (data.password) {
    updateData.password = await bcrypt.hash(data.password, 10);
  }

  await prisma.user.update({
    where: { id },
    data: updateData
  });

  revalidatePath("/usuarios");
}
