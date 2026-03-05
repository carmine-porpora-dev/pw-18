import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { DashboardSummary, Ticket } from "@/lib/types";
import { inferTicket } from "@/lib/server/ml";

const dataDir = path.resolve(process.cwd(), ".data");
const dataFile = path.join(dataDir, "tickets.json");

type StoredTicket = Ticket;
type MlFields = Pick<Ticket, "predicted_priority" | "predicted_category" | "confidence">;

const defaultMlFields: MlFields = {
  predicted_priority: undefined,
  predicted_category: undefined,
  confidence: undefined
};

async function ensureStore() {
  await mkdir(dataDir, { recursive: true });
  try {
    await readFile(dataFile, "utf-8");
  } catch {
    await writeFile(dataFile, "[]", "utf-8");
  }
}

async function readTickets() {
  await ensureStore();
  const raw = await readFile(dataFile, "utf-8");
  try {
    return JSON.parse(raw) as StoredTicket[];
  } catch {
    return [] as StoredTicket[];
  }
}

async function saveTickets(tickets: StoredTicket[]) {
  await ensureStore();
  await writeFile(dataFile, JSON.stringify(tickets, null, 2), "utf-8");
}

export async function listTickets() {
  const tickets = await readTickets();
  return tickets.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function getTicketById(id: string) {
  const tickets = await readTickets();
  return tickets.find((ticket) => ticket.id === id) ?? null;
}

export async function createTicket(description: string) {
  const tickets = await readTickets();

  let ml = defaultMlFields;
  try {
    ml = await inferTicket(description);
  } catch {
    ml = defaultMlFields;
  }

  const ticket: StoredTicket = {
    id: randomUUID(),
    description,
    status: "open",
    created_at: new Date().toISOString(),
    ...ml
  };

  tickets.push(ticket);
  await saveTickets(tickets);
  return ticket;
}

function getDateKey(dateIso: string) {
  return dateIso.slice(0, 10);
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const tickets = await readTickets();
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - 29);
  start.setHours(0, 0, 0, 0);

  const last30Tickets = tickets.filter((ticket) => new Date(ticket.created_at) >= start);
  const openNowCount = tickets.filter(
    (ticket) => ticket.status === "open" || ticket.status === "in_progress"
  ).length;
  const resolvedCount = last30Tickets.filter((ticket) => ticket.status === "resolved").length;

  const trendMap = new Map<string, number>();
  for (let i = 29; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    trendMap.set(key, 0);
  }

  for (const ticket of last30Tickets) {
    const key = getDateKey(ticket.created_at);
    if (trendMap.has(key)) {
      trendMap.set(key, (trendMap.get(key) ?? 0) + 1);
    }
  }

  const byCategory = new Map<string, number>();
  const byPriority = new Map<string, number>();
  for (const ticket of last30Tickets) {
    const category = ticket.predicted_category ?? "unknown";
    const priority = ticket.predicted_priority ?? "unknown";

    byCategory.set(category, (byCategory.get(category) ?? 0) + 1);
    byPriority.set(priority, (byPriority.get(priority) ?? 0) + 1);
  }

  return {
    last_30_days: {
      opened_count: last30Tickets.length,
      open_now_count: openNowCount,
      resolved_count: resolvedCount
    },
    opened_trend: [...trendMap.entries()].map(([date, opened]) => ({ date, opened })),
    by_category: [...byCategory.entries()].map(([category, count]) => ({ category, count })),
    by_priority: [...byPriority.entries()].map(([priority, count]) => ({ priority, count }))
  };
}
