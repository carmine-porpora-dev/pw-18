"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { TicketTable } from "@/components/ticket-table";
import { api } from "@/lib/api";
import { Ticket } from "@/lib/types";

type TicketFilterKey = "opened_30d" | "open_now" | "resolved_30d" | "closed_30d";

function isInLast30Days(isoDate: string) {
  const ticketDate = new Date(isoDate);
  if (Number.isNaN(ticketDate.getTime())) return false;

  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 29);

  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  return ticketDate >= start && ticketDate <= end;
}

function applyTicketFilter(tickets: Ticket[], filter: TicketFilterKey | null) {
  if (!filter) return tickets;

  if (filter === "opened_30d") return tickets.filter((t) => isInLast30Days(t.created_at));
  if (filter === "open_now") return tickets.filter((t) => t.status === "open" || t.status === "in_progress");
  if (filter === "resolved_30d") {
    return tickets.filter((t) => t.status === "resolved" && isInLast30Days(t.created_at));
  }
  if (filter === "closed_30d") {
    return tickets.filter((t) => t.status === "closed" && isInLast30Days(t.created_at));
  }

  return tickets;
}

function filterLabel(filter: TicketFilterKey | null) {
  if (filter === "opened_30d") return "Filtro: Ticket aperti negli ultimi 30 giorni";
  if (filter === "open_now") return "Filtro: Ticket attualmente aperti";
  if (filter === "resolved_30d") return "Filtro: Ticket risolti negli ultimi 30 giorni";
  if (filter === "closed_30d") return "Filtro: Ticket chiusi negli ultimi 30 giorni";
  return "Lista ticket con priorita/categoria";
}

export default function TicketsPage() {
  const searchParams = useSearchParams();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const rawFilter = searchParams.get("filter");
  const filter: TicketFilterKey | null =
    rawFilter === "opened_30d" ||
    rawFilter === "open_now" ||
    rawFilter === "resolved_30d" ||
    rawFilter === "closed_30d"
      ? rawFilter
      : null;
  const filteredTickets = applyTicketFilter(tickets, filter);

  useEffect(() => {
    api.listTickets()
      .then(setTickets)
      .catch((e) => setErr(e?.message ?? "Errore caricamento"));
  }, []);

  return (
    <AppShell>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-semibold">Ticket</div>
          <div className="text-sm text-zinc-500">{filterLabel(filter)}</div>
        </div>
      </div>

      <div className="mt-5">
        {err ? (
          <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">
            {err}
          </div>
        ) : (
          <TicketTable tickets={filteredTickets} />
        )}
      </div>
    </AppShell>
  );
}
