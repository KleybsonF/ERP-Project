"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { ROLE_PRESETS } from "@/app/lib/permissions";

const prisma = new PrismaClient();

export async function getUsers() {
  return await prisma.user.findMany({
    include: { employee: true },
    orderBy: { id: "asc" },
  });
}

export async function getUser(id: number) {
  return await prisma.user.findUnique({
    where: { id },
    include: { employee: true }
  });
}

export interface CreateUserData {
  login: string;
  email: string;
  password: string;
  name: string;
  cargo: string;
  numero: string;
  role?: string;
  permissions?: string | string[];
}

export async function createUser(data: CreateUserData) {
  try {
    const emp = await prisma.employee.create({
      data: {
        name: data.name,
        cargo: data.cargo,
        phone: data.numero,
        status: "Ativo"
      }
    });

    const hash = await bcrypt.hash(data.password, 10);

    // Determina o cargo/role principal
    let roleValue = data.role || "Operador";
    if (!data.role && typeof data.permissions === "string" && !data.permissions.startsWith("[")) {
      roleValue = data.permissions;
    }

    // Determina a matriz de permissões granulares
    let permissionsValue: string;
    if (Array.isArray(data.permissions)) {
      permissionsValue = JSON.stringify(data.permissions);
    } else if (typeof data.permissions === "string" && data.permissions.startsWith("[")) {
      permissionsValue = data.permissions;
    } else {
      permissionsValue = JSON.stringify(ROLE_PRESETS[roleValue] || ROLE_PRESETS["Operador"] || []);
    }

    const user = await prisma.user.create({
      data: {
        username: data.login.trim().toLowerCase(),
        email: data.email.trim().toLowerCase(),
        password: hash,
        role: roleValue,
        permissions: permissionsValue,
        employeeId: emp.id,
        ativo: true
      },
      include: { employee: true }
    });

    revalidatePath("/usuarios");
    return { success: true, user };
  } catch (error: any) {
    console.error("Erro ao criar usuário:", error);
    return { success: false, error: error.message || "Erro ao criar usuário." };
  }
}

export interface UpdateUserData {
  login: string;
  email: string;
  password?: string;
  name: string;
  cargo: string;
  numero: string;
  role?: string;
  permissions?: string | string[];
}

export async function updateUser(id: number, data: UpdateUserData) {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return { success: false, error: "Usuário não encontrado." };

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

    let roleValue = data.role || user.role;
    if (!data.role && typeof data.permissions === "string" && !data.permissions.startsWith("[")) {
      roleValue = data.permissions;
    }

    let permissionsValue = user.permissions;
    if (Array.isArray(data.permissions)) {
      permissionsValue = JSON.stringify(data.permissions);
    } else if (typeof data.permissions === "string" && data.permissions.startsWith("[")) {
      permissionsValue = data.permissions;
    } else if (data.role && data.role !== user.role && !data.permissions) {
      permissionsValue = JSON.stringify(ROLE_PRESETS[data.role] || []);
    }

    const updateData: any = {
      username: data.login.trim().toLowerCase(),
      email: data.email.trim().toLowerCase(),
      role: roleValue,
      permissions: permissionsValue
    };

    if (data.password && data.password.trim().length > 0) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: { employee: true }
    });

    revalidatePath("/usuarios");
    return { success: true, user: updatedUser };
  } catch (error: any) {
    console.error("Erro ao atualizar usuário:", error);
    return { success: false, error: error.message || "Erro ao atualizar usuário." };
  }
}

export async function updateUserPermissions(id: number, role: string, permissions: string[]) {
  try {
    const updated = await prisma.user.update({
      where: { id },
      data: {
        role,
        permissions: JSON.stringify(permissions)
      },
      include: { employee: true }
    });
    revalidatePath("/usuarios");
    return { success: true, user: updated };
  } catch (error: any) {
    console.error("Erro ao atualizar permissões do usuário:", error);
    return { success: false, error: error.message || "Erro ao atualizar permissões." };
  }
}

export async function toggleUserStatus(id: number) {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return { success: false, error: "Usuário não encontrado." };

    const updated = await prisma.user.update({
      where: { id },
      data: { ativo: !user.ativo },
      include: { employee: true }
    });

    revalidatePath("/usuarios");
    return { success: true, ativo: updated.ativo, user: updated };
  } catch (error: any) {
    console.error("Erro ao alterar status do usuário:", error);
    return { success: false, error: error.message || "Erro ao alterar status." };
  }
}

export async function hideUser(id: number) {
  await prisma.user.update({
    where: { id },
    data: { ativo: false }
  });
  revalidatePath("/usuarios");
  return { success: true };
}

export async function restoreUser(id: number) {
  await prisma.user.update({
    where: { id },
    data: { ativo: true }
  });
  revalidatePath("/usuarios");
  return { success: true };
}
