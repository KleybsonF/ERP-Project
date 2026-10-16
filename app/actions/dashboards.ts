"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getSession } from "@/app/lib/auth";
import { createLog } from "@/app/actions/logs";

const prisma = new PrismaClient();

import { WidgetConfig, WidgetDefinition, WIDGET_CATALOG } from "@/app/lib/dashboardCatalog";
export type { WidgetConfig, WidgetDefinition };

export async function ensureDefaultDashboards() {
  const count = await prisma.customDashboard.count();
  if (count > 0) return;

  const defaultExecWidgets: WidgetConfig[] = [
    { id: "w-1", widgetKey: "kpi_financial_pulse", title: "Pulso Financeiro Executivo", colSpan: 12, order: 1, visible: true },
    { id: "w-2", widgetKey: "quick_actions_bar", title: "Ações Rápidas de Gestão", colSpan: 12, order: 2, visible: true },
    { id: "w-3", widgetKey: "chart_financial_cashflow", title: "Fluxo de Caixa Mensal (Entradas vs Saídas)", colSpan: 8, order: 3, visible: true },
    { id: "w-4", widgetKey: "chart_os_by_status", title: "Distribuição de O.S. por Status", colSpan: 4, order: 4, visible: true },
    { id: "w-5", widgetKey: "chart_productivity_ranking", title: "Top Produtividade dos Técnicos", colSpan: 6, order: 5, visible: true },
    { id: "w-6", widgetKey: "chart_revenue_by_category", title: "Receitas por Categoria", colSpan: 6, order: 6, visible: true },
    { id: "w-7", widgetKey: "table_upcoming_agenda", title: "Agenda de Ocorrências / O.S. Imediatas", colSpan: 8, order: 7, visible: true },
    { id: "w-8", widgetKey: "table_recent_activity", title: "Feed de Atividades ao Vivo", colSpan: 4, order: 8, visible: true },
    { id: "w-9", widgetKey: "table_top_clients", title: "Principais Clientes por Volume", colSpan: 6, order: 9, visible: true },
    { id: "w-10", widgetKey: "table_critical_stock", title: "Alerta de Estoque Crítico", colSpan: 6, order: 10, visible: true }
  ];

  const defaultOpWidgets: WidgetConfig[] = [
    { id: "w-1", widgetKey: "kpi_operations_pulse", title: "Pulso Operacional & Campo", colSpan: 12, order: 1, visible: true },
    { id: "w-2", widgetKey: "quick_actions_bar", title: "Ações Rápidas", colSpan: 12, order: 2, visible: true },
    { id: "w-3", widgetKey: "table_upcoming_agenda", title: "Agenda Operacional Imediata", colSpan: 8, order: 3, visible: true },
    { id: "w-4", widgetKey: "chart_os_by_status", title: "Status Geral de Ocorrências", colSpan: 4, order: 4, visible: true },
    { id: "w-5", widgetKey: "chart_productivity_ranking", title: "Ranking da Equipe de Campo", colSpan: 6, order: 5, visible: true },
    { id: "w-6", widgetKey: "kpi_fleet_stock", title: "Frota & Regulatório ANVISA", colSpan: 6, order: 6, visible: true },
    { id: "w-7", widgetKey: "table_critical_stock", title: "Estoque Baixo & Reposição", colSpan: 12, order: 7, visible: true }
  ];

  const defaultFinWidgets: WidgetConfig[] = [
    { id: "w-1", widgetKey: "kpi_financial_pulse", title: "Resumo Geral de Caixa & Faturamento", colSpan: 12, order: 1, visible: true },
    { id: "w-2", widgetKey: "chart_financial_cashflow", title: "Evolução do Fluxo de Caixa", colSpan: 8, order: 2, visible: true },
    { id: "w-3", widgetKey: "chart_revenue_by_category", title: "Faturamento por Segmento", colSpan: 4, order: 3, visible: true },
    { id: "w-4", widgetKey: "table_top_clients", title: "Carteira de Maiores Clientes", colSpan: 6, order: 4, visible: true },
    { id: "w-5", widgetKey: "table_recent_activity", title: "Últimas Movimentações Financeiras", colSpan: 6, order: 5, visible: true }
  ];

  await prisma.customDashboard.create({
    data: {
      name: "Visão Executiva (Padrão)",
      description: "Dashboard 360º de alto impacto com métricas executivas, saúde financeira e operações.",
      icon: "LayoutDashboard",
      isDefault: true,
      isPublic: true,
      widgets: JSON.stringify(defaultExecWidgets)
    }
  });

  await prisma.customDashboard.create({
    data: {
      name: "Operações & Campo",
      description: "Foco intensivo na rotina de O.S., agenda de visitas, produtividade dos técnicos e frota.",
      icon: "Briefcase",
      isDefault: false,
      isPublic: true,
      widgets: JSON.stringify(defaultOpWidgets)
    }
  });

  await prisma.customDashboard.create({
    data: {
      name: "Financeiro & Controladoria",
      description: "Painel focado em fluxo de caixa, rentabilidade de clientes e categorias contábeis.",
      icon: "DollarSign",
      isDefault: false,
      isPublic: true,
      widgets: JSON.stringify(defaultFinWidgets)
    }
  });
}

export async function getDashboards() {
  await ensureDefaultDashboards();

  const dashboards = await prisma.customDashboard.findMany({
    include: {
      allowedUsers: {
        select: { id: true, email: true, username: true, role: true }
      }
    },
    orderBy: [
      { isDefault: "desc" },
      { name: "asc" }
    ]
  });

  return dashboards.map(d => ({
    ...d,
    parsedWidgets: (() => {
      try {
        return JSON.parse(d.widgets) as WidgetConfig[];
      } catch {
        return [];
      }
    })()
  }));
}

export async function getUserAccessibleDashboards() {
  await ensureDefaultDashboards();
  const session = await getSession();

  const allDashboards = await prisma.customDashboard.findMany({
    include: {
      allowedUsers: {
        select: { id: true, email: true, username: true, role: true }
      }
    },
    orderBy: [
      { isDefault: "desc" },
      { name: "asc" }
    ]
  });

  const accessible = allDashboards.filter(d => {
    // Administrador can see all dashboards
    if (!session || session.role === "Administrador") return true;
    // Public dashboards can be seen by everyone logged in
    if (d.isPublic) return true;
    // If user is directly linked in allowedUsers
    return d.allowedUsers.some(u => u.id === session.userId);
  });

  return accessible.map(d => ({
    ...d,
    parsedWidgets: (() => {
      try {
        return JSON.parse(d.widgets) as WidgetConfig[];
      } catch {
        return [];
      }
    })()
  }));
}

export async function getDashboardUsersList() {
  return await prisma.user.findMany({
    where: { ativo: true },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      employee: {
        select: { name: true }
      }
    },
    orderBy: { email: "asc" }
  });
}

export async function createDashboard(data: {
  name: string;
  description?: string;
  icon?: string;
  isDefault?: boolean;
  isPublic?: boolean;
  widgets: WidgetConfig[];
  userIds?: number[];
}) {
  if (data.isDefault) {
    await prisma.customDashboard.updateMany({
      data: { isDefault: false }
    });
  }

  const created = await prisma.customDashboard.create({
    data: {
      name: data.name.trim(),
      description: data.description?.trim() || null,
      icon: data.icon || "LayoutDashboard",
      isDefault: !!data.isDefault,
      isPublic: data.isPublic !== undefined ? !!data.isPublic : false,
      widgets: JSON.stringify(data.widgets),
      allowedUsers: data.userIds && data.userIds.length > 0 ? {
        connect: data.userIds.map(id => ({ id }))
      } : undefined
    },
    include: { allowedUsers: true }
  });

  await createLog("CRIOU", "Dashboards", `Criou o dashboard personalizado "${created.name}" com ${data.widgets.length} widget(s).`);

  revalidatePath("/");
  revalidatePath("/administracao/dashboards");
  return created;
}

export async function updateDashboard(
  id: number,
  data: {
    name?: string;
    description?: string;
    icon?: string;
    isDefault?: boolean;
    isPublic?: boolean;
    widgets?: WidgetConfig[];
    userIds?: number[];
  }
) {
  if (data.isDefault) {
    await prisma.customDashboard.updateMany({
      where: { id: { not: id } },
      data: { isDefault: false }
    });
  }

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.description !== undefined) updateData.description = data.description?.trim() || null;
  if (data.icon !== undefined) updateData.icon = data.icon;
  if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;
  if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;
  if (data.widgets !== undefined) updateData.widgets = JSON.stringify(data.widgets);

  if (data.userIds !== undefined) {
    updateData.allowedUsers = {
      set: data.userIds.map(uid => ({ id: uid }))
    };
  }

  const updated = await prisma.customDashboard.update({
    where: { id },
    data: updateData,
    include: { allowedUsers: true }
  });

  await createLog("EDITOU", "Dashboards", `Atualizou as configurações do dashboard "${updated.name}".`);

  revalidatePath("/");
  revalidatePath("/administracao/dashboards");
  return updated;
}

export async function deleteDashboard(id: number) {
  const d = await prisma.customDashboard.findUnique({ where: { id } });
  if (d?.isDefault) {
    throw new Error("Não é possível excluir o dashboard configurado como padrão. Defina outro dashboard como padrão antes de excluir este.");
  }

  await prisma.customDashboard.delete({ where: { id } });
  await createLog("EXCLUIU", "Dashboards", `Excluiu o dashboard #${id} ("${d?.name}").`);

  revalidatePath("/");
  revalidatePath("/administracao/dashboards");
  return { success: true };
}

export async function duplicateDashboard(id: number) {
  const orig = await prisma.customDashboard.findUnique({
    where: { id },
    include: { allowedUsers: true }
  });

  if (!orig) throw new Error("Dashboard não encontrado para duplicação.");

  const copy = await prisma.customDashboard.create({
    data: {
      name: `${orig.name} (Cópia)`,
      description: orig.description,
      icon: orig.icon,
      isDefault: false,
      isPublic: orig.isPublic,
      widgets: orig.widgets,
      allowedUsers: {
        connect: orig.allowedUsers.map(u => ({ id: u.id }))
      }
    }
  });

  await createLog("CRIOU", "Dashboards", `Duplicou o dashboard "${orig.name}" -> "${copy.name}".`);

  revalidatePath("/");
  revalidatePath("/administracao/dashboards");
  return copy;
}
