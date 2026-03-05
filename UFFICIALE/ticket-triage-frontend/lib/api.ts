import { CreateTicketInput, DashboardSummary, Ticket } from "./types";

const configuredBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ?? "";
const defaultDevBaseUrl = "http://127.0.0.1:8000";
const baseUrl =
  configuredBaseUrl || (process.env.NODE_ENV === "development" ? defaultDevBaseUrl : "");

function normalizeBaseUrl(url: string) {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function withLeadingSlash(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
}

function buildUrl(base: string, path: string) {
  return `${normalizeBaseUrl(base)}${withLeadingSlash(path)}`;
}

function stripApiPrefix(path: string) {
  if (path === "/api") return "/";
  return path.startsWith("/api/") ? path.slice(4) : path;
}

function dedupe(values: string[]) {
  return [...new Set(values)];
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const normalizedPath = withLeadingSlash(path);
  const candidatePaths = [normalizedPath];
  const withoutApiPrefix = stripApiPrefix(withLeadingSlash(path));
  if (withoutApiPrefix !== candidatePaths[0]) {
    candidatePaths.push(withoutApiPrefix);
  }

  const candidateTargets = dedupe([
    ...candidatePaths,
    ...candidatePaths.map((candidatePath) => (baseUrl ? buildUrl(baseUrl, candidatePath) : ""))
  ]).filter(Boolean);

  let lastError: Error | null = null;

  for (const target of candidateTargets) {
    let res: Response;
    try {
      res = await fetch(target, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...(init?.headers ?? {})
        },
        cache: "no-store"
      });
    } catch {
      lastError = new Error(
        "Backend non raggiungibile. Verifica che il servizio API sia avviato e che NEXT_PUBLIC_API_BASE_URL sia corretto."
      );
      continue;
    }

    if (res.ok) {
      return (await res.json()) as T;
    }

    if (res.status === 404 && target !== candidateTargets[candidateTargets.length - 1]) {
      continue;
    }

    const text = await res.text().catch(() => "");
    lastError = new Error(`API ${res.status}: ${text || res.statusText}`);
    break;
  }

  throw lastError ?? new Error("Errore API sconosciuto");
}

export const api = {
  listTickets: () => http<Ticket[]>("/api/tickets"),
  getTicket: (id: string) => http<Ticket>(`/api/tickets/${id}`),
  createTicket: (payload: CreateTicketInput) =>
    http<Ticket>("/api/tickets", { method: "POST", body: JSON.stringify(payload) }),
  dashboardSummary: () => http<DashboardSummary>("/api/dashboard/summary")
};
