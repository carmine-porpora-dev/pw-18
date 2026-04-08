"use client";

import { Suspense, useEffect, useState } from "react";
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
    return tickets.filter((t) => t.status === "closed" && t.closed_at && isInLast30Days(t.closed_at));
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

function toCsvValue(value: string | number | null | undefined) {
  const text = value == null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function exportTicketsToCsv(tickets: Ticket[]) {
  const header = [
    "id",
    "description",
    "status",
    "priority",
    "category",
    "created_at",
    "created_by_user_id",
    "assigned_group_id"
  ];

  const rows = tickets.map((ticket) =>
    [
      ticket.id,
      ticket.description,
      ticket.status,
      ticket.priority,
      ticket.category,
      ticket.created_at,
      ticket.created_by_user_id,
      ticket.assigned_group_id
    ]
      .map((value) => toCsvValue(value))
      .join(",")
  );

  const csv = [header.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `tickets-gruppo-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function TicketsPageContent() {
  const searchParams = useSearchParams();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [me, setMe] = useState<Me | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
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
  const groupTicketIds = groupTickets.map((ticket) => ticket.id);
  const groupTicketIdsKey = groupTicketIds.join("|");

  useEffect(() => {
    setSelectedTicketIds((currentIds) =>
      currentIds.filter((ticketId) => groupTicketIds.includes(ticketId))
    );
  }, [groupTicketIdsKey]);

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

  function toggleTicketSelection(ticketId: string) {
    setSelectedTicketIds((currentIds) =>
      currentIds.includes(ticketId)
        ? currentIds.filter((id) => id !== ticketId)
        : [...currentIds, ticketId]
    );
  }

  function toggleSelectAllGroupTickets() {
    const allSelected =
      groupTicketIds.length > 0 && groupTicketIds.every((ticketId) => selectedTicketIds.includes(ticketId));

    setSelectedTicketIds(allSelected ? [] : groupTicketIds);
  }

  function exportSelectedGroupTickets() {
    const selectedTickets = groupTickets.filter((ticket) => selectedTicketIds.includes(ticket.id));
    if (selectedTickets.length === 0) return;
    exportTicketsToCsv(selectedTickets);
  }

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
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="text-sm font-medium uppercase tracking-[0.18em] text-zinc-500">
                  {me?.is_super_admin === 1 ? "Tutti i ticket" : "Ticket del gruppo"}
                </div>
                {me?.is_super_admin !== 1 && (
                  <button
                    type="button"
                    onClick={exportSelectedGroupTickets}
                    disabled={selectedTicketIds.length === 0}
                    className="rounded-xl bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-50"
                  >
                    Esporta CSV
                  </button>
                )}
              </div>
              <TicketTable
                tickets={groupTickets}
                selectable={me?.is_super_admin !== 1}
                selectedIds={selectedTicketIds}
                onToggleTicket={toggleTicketSelection}
                onToggleAll={toggleSelectAllGroupTickets}
              />
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

export default function TicketsPage() {
  return (
    <Suspense fallback={<AppShell><div className="text-sm text-zinc-500">Caricamento...</div></AppShell>}>
      <TicketsPageContent />
    </Suspense>
  );
}
