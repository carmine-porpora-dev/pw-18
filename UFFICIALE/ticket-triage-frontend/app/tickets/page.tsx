"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { TicketTable } from "@/components/ticket-table";
import { api } from "@/lib/api";
import { getCachedSessionUser } from "@/lib/client/session-user";
import { Ticket } from "@/lib/types";

type TicketFilterKey = "opened_30d" | "open_now" | "resolved_30d" | "closed_30d";
type Me = {
  id: number;
  group_id: number | null;
  is_super_admin: number;
};

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
  const [me, setMe] = useState<Me | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const rawFilter = searchParams.get("filter");
  const filter: TicketFilterKey | null =
    rawFilter === "opened_30d" ||
    rawFilter === "open_now" ||
    rawFilter === "resolved_30d" ||
    rawFilter === "closed_30d"
      ? rawFilter
      : null;
  const filteredTickets = applyTicketFilter(tickets, filter);
  const groupTickets =
    me && me.is_super_admin !== 1 && typeof me.group_id === "number"
      ? filteredTickets.filter((t) => t.assigned_group_id === me.group_id)
      : filteredTickets;
  const createdByMeTickets =
    me && me.is_super_admin !== 1
      ? filteredTickets.filter(
          (t) => t.created_by_user_id === me.id && t.assigned_group_id !== me.group_id
        )
      : [];

  useEffect(() => {
    setLoading(true);
    Promise.all([api.listTickets(), getCachedSessionUser()])
      .then(([ticketRows, meData]) => {
        setTickets(ticketRows);
        if (!meData) {
          throw new Error("Errore caricamento utente");
        }
        setMe(meData);
      })
      .catch((e) => setErr(e?.message ?? "Errore caricamento"))
      .finally(() => setLoading(false));
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
        {loading ? (
          <div className="text-sm text-zinc-500">Caricamento...</div>
        ) : err ? (
          <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">
            {err}
          </div>
        ) : (
          <div className="grid gap-6">
            <div>
              <div className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-zinc-500">
                {me?.is_super_admin === 1 ? "Tutti i ticket" : "Ticket del gruppo"}
              </div>
              <TicketTable tickets={groupTickets} />
            </div>

            {me?.is_super_admin !== 1 && (
              <div>
                <div className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-zinc-500">
                  Creati da me
                </div>
                {createdByMeTickets.length > 0 ? (
                  <TicketTable tickets={createdByMeTickets} />
                ) : (
                  <div className="rounded-2xl bg-white px-4 py-5 text-sm text-zinc-500 ring-1 ring-zinc-100">
                    Nessun ticket creato da te assegnato ad altri gruppi.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
