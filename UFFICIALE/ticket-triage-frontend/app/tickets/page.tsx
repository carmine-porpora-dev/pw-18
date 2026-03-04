"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { TicketTable } from "@/components/ticket-table";
import { api } from "@/lib/api";
import { Ticket } from "@/lib/types";

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [err, setErr] = useState<string | null>(null);

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
          <div className="text-sm text-zinc-500">Lista ticket con priorità/categoria suggerite dal modello.</div>
        </div>
      </div>

      <div className="mt-5">
        {err ? (
          <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">
            {err}
          </div>
        ) : (
          <TicketTable tickets={tickets} />
        )}
      </div>
    </AppShell>
  );
}