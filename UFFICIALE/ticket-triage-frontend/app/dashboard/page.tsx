"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell.tsx";
import { StatCard } from "@/components/stat-card";
import { BreakdownBarChart, OpenedTrendChart } from "@/components/charts";
import { api } from "@/lib/api";
import { DashboardSummary } from "@/lib/types"; 

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api.dashboardSummary()
      .then(setData)
      .catch((e) => setErr(e?.message ?? "Errore dashboard"));
  }, []);

  return (
    <AppShell>
      <div>
        <div className="text-lg font-semibold">Dashboard</div>
        <div className="text-sm text-zinc-500">
          Incidenti ultimi 30 giorni, andamento aperture e breakdown per categoria/priorità.
        </div>
      </div>

      <div className="mt-5">
        {err && (
          <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">{err}</div>
        )}

        {!data ? (
          <div className="text-sm text-zinc-500">Caricamento...</div>
        ) : (
          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-3">
              <StatCard
                title="Ticket aperti (30 giorni)"
                value={String(data.last_30_days.opened_count)}
                subtitle="Totale creati negli ultimi 30 giorni"
              />
              <StatCard
                title="Attualmente aperti"
                value={String(data.last_30_days.open_now_count)}
                subtitle="Open / in_progress"
              />
              <StatCard
                title="Risolti (30 giorni)"
                value={String(data.last_30_days.resolved_count)}
                subtitle="Risolti negli ultimi 30 giorni"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-white p-5 ring-1 ring-zinc-100">
                <div className="text-sm font-medium">Andamento aperture</div>
                <div className="mt-3">
                  <OpenedTrendChart data={data.opened_trend} />
                </div>
              </div>

              <div className="rounded-2xl bg-white p-5 ring-1 ring-zinc-100">
                <div className="text-sm font-medium">Ticket per categoria (ML)</div>
                <div className="mt-3">
                  <BreakdownBarChart data={data.by_category} xKey="category" barKey="count" />
                </div>
              </div>

              <div className="rounded-2xl bg-white p-5 ring-1 ring-zinc-100 md:col-span-2">
                <div className="text-sm font-medium">Ticket per priorità (ML)</div>
                <div className="mt-3">
                  <BreakdownBarChart data={data.by_priority} xKey="priority" barKey="count" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}