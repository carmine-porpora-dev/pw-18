import { CreateTicketInput, DashboardSummary, Ticket } from "./types";

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

function mustBaseUrl(): string {
  if (!baseUrl) throw new Error("Missing NEXT_PUBLIC_API_BASE_URL");
  return baseUrl;
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${mustBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return (await res.json()) as T;
}

export const api = {
  listTickets: () => http<Ticket[]>("/api/tickets"),
  getTicket: (id: string) => http<Ticket>(`/api/tickets/${id}`),
  createTicket: (payload: CreateTicketInput) =>
    http<Ticket>("/api/tickets", { method: "POST", body: JSON.stringify(payload) }),
  dashboardSummary: () => http<DashboardSummary>("/api/dashboard/summary")
};