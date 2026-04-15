"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ResolveTicketButton } from "@/components/resolve-ticket-button";
import { api } from "@/lib/api";
import { getCachedSessionUser, type ClientSessionUser } from "@/lib/client/session-user";
import { Ticket } from "@/lib/types";
import { badgeForPriority, cn, formatDate } from "@/lib/utils";

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const [t, setT] = useState<Ticket | null>(null);
  const [me, setMe] = useState<ClientSessionUser | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const showPastActions = typeof t?.AzioniFatteInPassato === "string" && t.AzioniFatteInPassato.trim().length > 0;
  const showTop5 = Array.isArray(t?.Top5) && t.Top5.length > 0;
  const showClosureReason = typeof t?.closure_reason === "string" && t.closure_reason.trim().length > 0;

  useEffect(() => {
    Promise.all([api.getTicket(params.id), getCachedSessionUser()])
      .then(([ticket, user]) => {
        setT(ticket);
        setMe(user);
      })
      .catch((e) => setErr(e?.message ?? "Errore"));
  }, [params.id]);

  return (
    <AppShell>
      {err && (
        <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">{err}</div>
      )}

      {!t ? (
        <div className="text-sm text-zinc-500">Caricamento...</div>
      ) : (
        <div className="grid gap-5">
          <div className="rounded-3xl bg-white p-5 ring-1 ring-zinc-100">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
                  Dettaglio ticket
                </div>
                <div className="mt-2 text-2xl font-semibold text-zinc-950">{t.id}</div>
                <div className="mt-1 text-sm text-zinc-500">
                  {formatDate(t.created_at)} - <span className="font-medium">{t.status}</span>
                </div>
              </div>

              <div className="flex w-full justify-start md:w-auto md:justify-end">
                <ResolveTicketButton ticket={t} me={me} onResolved={setT} variant="detail" />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 border-t border-zinc-100 pt-4">
              <span className={cn("rounded-xl px-3 py-1.5 text-xs", badgeForPriority(t.priority))}>
                Priorita: {t.priority ?? "-"}
              </span>
              <span className="rounded-xl bg-zinc-100 px-3 py-1.5 text-xs text-zinc-700">
                Categoria: {t.category ?? "-"}
              </span>
            </div>
          </div>

          <div className="rounded-2xl bg-zinc-50 p-5 ring-1 ring-zinc-100">
            <div className="text-sm font-medium">Descrizione</div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700">{t.description}</p>
          </div>

          {showClosureReason && (
            <div className="rounded-2xl bg-zinc-50 p-5 ring-1 ring-zinc-100">
              <div className="text-sm font-medium">Causale di chiusura</div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700">{t.closure_reason}</p>
            </div>
          )}

          {showPastActions && (
            <div className="rounded-2xl bg-zinc-50 p-5 ring-1 ring-zinc-100">
              <div className="text-sm font-medium">Azioni effettuate in passato</div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700">{t.AzioniFatteInPassato}</p>
            </div>
          )}

          {showTop5 && (
            <div className="rounded-2xl bg-zinc-50 p-5 ring-1 ring-zinc-100">
              <div className="text-sm font-medium">Parole che influenzano la scelta</div>
              <p className="mt-2 text-sm text-zinc-700">{t.Top5?.join(", ")}</p>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
