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

export async function listVisibleTicketsForUser(userId: number, groupId: number | null) {
  return runDb<Ticket[]>("list_tickets", { user_id: userId, group_id: groupId });
}

export async function getTicketById(id: string) {
  return runDb<Ticket | null>("get_ticket", { id });
}

export async function getTicketByIdForGroup(id: string, groupId: number) {
  return runDb<Ticket | null>("get_ticket", { id, group_id: groupId });
}

export async function getTicketByIdVisibleToUser(id: string, userId: number, groupId: number | null) {
  return runDb<Ticket | null>("get_ticket", { id, user_id: userId, group_id: groupId });
}

export async function createTicket(description: string, userId: number, userGroupId: number | null) {
  let ml = defaultMlFields;
  try {
    ml = await inferTicket(description);
  } catch (error) {
    console.error("Errore durante l'inferenza ML del ticket", error);
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
