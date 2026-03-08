import { randomUUID } from "node:crypto";
import type { DashboardSummary, Ticket } from "@/lib/types";
import { runDb } from "@/lib/server/db";
import { inferTicket } from "@/lib/server/ml";

type MlFields = Pick<Ticket, "priority" | "category" | "AzioniFatteInPassato" | "Top5">;

const defaultMlFields: MlFields = {
  priority: undefined,
  category: undefined,
  AzioniFatteInPassato: undefined,
  Top5: []
};

export async function listTickets() {
  return runDb<Ticket[]>("list_tickets");
}

export async function listTicketsByGroup(groupId: number) {
  return runDb<Ticket[]>("list_tickets", { group_id: groupId });
}

export async function getTicketById(id: string) {
  const ticket = await runDb<Ticket | null>("get_ticket", { id });
  return hydrateTicketMlFields(ticket);
}

export async function getTicketByIdForGroup(id: string, groupId: number) {
  const ticket = await runDb<Ticket | null>("get_ticket", { id, group_id: groupId });
  return hydrateTicketMlFields(ticket);
}

export async function createTicket(description: string, userId: number, userGroupId: number | null) {
  let ml = defaultMlFields;
  try {
    ml = await inferTicket(description);
  } catch {
    ml = defaultMlFields;
  }

  let assignedGroupId = userGroupId;
  if (ml.category) {
    const groupIdByName = await runDb<number | null>("get_group_id_by_name", { name: ml.category });
    if (typeof groupIdByName === "number") {
      assignedGroupId = groupIdByName;
    }
  }

  const ticket: Ticket = {
    id: `TKT-${randomUUID().replaceAll("-", "").toUpperCase().slice(-8)}`,
    description,
    status: "open",
    created_at: new Date().toISOString(),
    ...ml,
    created_by_user_id: userId,
    assigned_group_id: assignedGroupId
  };

  return runDb<Ticket>("create_ticket", {
    ticket,
    ml_meta: {
      model_name: "motore_ml",
      model_version: "v1"
    }
  });
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return runDb<DashboardSummary>("dashboard_summary");
}

export async function getDashboardSummaryForGroup(groupId: number): Promise<DashboardSummary> {
  return runDb<DashboardSummary>("dashboard_summary", { group_id: groupId });
}

async function hydrateTicketMlFields(ticket: Ticket | null) {
  if (!ticket) return null;

  const hasAction = typeof ticket.AzioniFatteInPassato === "string" && ticket.AzioniFatteInPassato.trim().length > 0;
  const hasTop5 = Array.isArray(ticket.Top5) && ticket.Top5.length > 0;
  if (hasAction && hasTop5) return ticket;

  try {
    const inferred = await inferTicket(ticket.description);
    return runDb<Ticket | null>("update_ticket_ml", {
      id: ticket.id,
      priority: inferred.priority,
      category: inferred.category,
      AzioniFatteInPassato: inferred.AzioniFatteInPassato,
      Top5: inferred.Top5
    });
  } catch {
    return ticket;
  }
}
