"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { BreakdownBarChart, OpenedTrendChart } from "@/components/charts";
import { api } from "@/lib/api";
import { DashboardSummary } from "@/lib/types";

function buildFlatTrend(days: number) {
  const now = new Date();
  return Array.from({ length: days }, (_, index) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (days - index - 1));
    const date = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
    return { date, opened: 0 };
  });
}

const EMPTY_DASHBOARD: DashboardSummary = {
  last_30_days: {
    opened_count: 0,
    open_now_count: 0,
    resolved_count: 0
  },
  opened_trend: buildFlatTrend(7),
  by_category: [{ category: "Nessuna", count: 0 }],
  by_priority: [
    { priority: "low", count: 0 },
    { priority: "medium", count: 0 },
    { priority: "high", count: 0 },
    { priority: "critical", count: 0 }
  ]
};

function normalizeDashboard(data: DashboardSummary | null | undefined): DashboardSummary {
  if (!data) return EMPTY_DASHBOARD;

  return {
    last_30_days: {
      opened_count: data.last_30_days?.opened_count ?? 0,
      open_now_count: data.last_30_days?.open_now_count ?? 0,
      resolved_count: data.last_30_days?.resolved_count ?? 0
    },
    opened_trend: data.opened_trend?.length ? data.opened_trend : EMPTY_DASHBOARD.opened_trend,
    by_category: data.by_category?.length ? data.by_category : EMPTY_DASHBOARD.by_category,
    by_priority: data.by_priority?.length ? data.by_priority : EMPTY_DASHBOARD.by_priority
  };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary>(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.dashboardSummary()
      .then((res) => {
        setData(normalizeDashboard(res));
      })
      .catch(() => {
        setData(EMPTY_DASHBOARD);
      })
      .finally(() => setLoading(false));
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
        {loading ? (
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
