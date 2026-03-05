"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { api } from "@/lib/api";
import { Ticket } from "@/lib/types";
import { badgeForPriority, cn, formatDate } from "@/lib/utils";

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const [t, setT] = useState<Ticket | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api.getTicket(params.id)
      .then(setT)
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
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-lg font-semibold">Ticket {t.id}</div>
              <div className="text-sm text-zinc-500">
                {formatDate(t.created_at)} • <span className="font-medium">{t.status}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className={cn("rounded-xl px-3 py-1.5 text-xs", badgeForPriority(t.predicted_priority))}>
                Priorità: {t.predicted_priority ?? "priorità: —"}
              </span>
              <span className="rounded-xl bg-zinc-100 px-3 py-1.5 text-xs text-zinc-700">
                Categoria: {t.predicted_category ?? "—"}
              </span>
              {typeof t.confidence === "number" && (
                <span className="rounded-xl bg-zinc-100 px-3 py-1.5 text-xs text-zinc-700">
                  confidenza: {Math.round(t.confidence * 100)}%
                </span>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-zinc-50 p-5 ring-1 ring-zinc-100">
            <div className="text-sm font-medium">Descrizione</div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700">{t.description}</p>
          </div>

          <div className="text-xs text-zinc-500">
            Nota: il triage ML viene tipicamente eseguito lato backend alla creazione del ticket, per garantire coerenza e audit, se noti inesattezze o errate assegnazioni, assegnare il ticket correttamente. 
          </div>
        </div>
      )}
    </AppShell>
  );
}
