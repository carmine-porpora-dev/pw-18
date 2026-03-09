"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import {
  BreakdownPieChart,
  OpenedTrendChart,
  TicketTrendChart
} from "@/components/charts";
import { api } from "@/lib/api";
import { DashboardSummary } from "@/lib/types";

function buildFlatTrend(days: number, key: "opened" | "closed") {
  const now = new Date();
  return Array.from({ length: days }, (_, index) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (days - index - 1));
    const date = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
    return { date, [key]: 0 };
  });
}

const EMPTY_DASHBOARD: DashboardSummary = {
  last_30_days: {
    opened_count: 0,
    open_now_count: 0,
    resolved_count: 0,
    closed_count: 0
  },
  opened_trend: buildFlatTrend(7, "opened") as Array<{ date: string; opened: number }>,
  closed_trend: buildFlatTrend(7, "closed") as Array<{ date: string; closed: number }>,
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
      resolved_count: data.last_30_days?.resolved_count ?? 0,
      closed_count: data.last_30_days?.closed_count ?? 0
    },
    opened_trend: data.opened_trend?.length ? data.opened_trend : EMPTY_DASHBOARD.opened_trend,
    closed_trend: data.closed_trend?.length ? data.closed_trend : EMPTY_DASHBOARD.closed_trend,
    by_category: data.by_category?.length ? data.by_category : EMPTY_DASHBOARD.by_category,
    by_priority: data.by_priority?.length ? data.by_priority : EMPTY_DASHBOARD.by_priority
  };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary>(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.dashboardSummary(), fetch("/api/auth/me", { cache: "no-store" })])
      .then(async ([summary, meRes]) => {
        setData(normalizeDashboard(summary));
        if (meRes.ok) {
          const me = await meRes.json();
          setIsSuperAdmin(me?.is_super_admin === 1);
        } else {
          setIsSuperAdmin(false);
        }
      })
      .catch(() => {
        setData(EMPTY_DASHBOARD);
        setIsSuperAdmin(false);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <div>
        <div className="text-lg font-semibold">Dashboard</div>
        <div className="text-sm text-zinc-500">
          Ticket ultimi 30 giorni, trend aperture/chiusure e breakdown per priorita.
        </div>
      </div>

      <div className="mt-5">
        {loading ? (
          <div className="text-sm text-zinc-500">Caricamento...</div>
        ) : (
          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-4">
              <StatCard
                title="Ticket aperti (30 giorni)"
                value={String(data.last_30_days.opened_count)}
                subtitle="Totale creati negli ultimi 30 giorni"
                href="/tickets?filter=opened_30d"
              />
              <StatCard
                title="Attualmente aperti"
                value={String(data.last_30_days.open_now_count)}
                subtitle="Totale Ticket Open"
                href="/tickets?filter=open_now"
              />
              <StatCard
                title="Risolti (30 giorni)"
                value={String(data.last_30_days.resolved_count)}
                subtitle=" Ticket risolti negli ultimi 30 giorni"
                href="/tickets?filter=resolved_30d"
              />
              <StatCard
                title="Chiusi (30 giorni)"
                value={String(data.last_30_days.closed_count)}
                subtitle="Ticket chiusi negli ultimi 30 giorni"
                href="/tickets?filter=closed_30d"
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
                <div className="text-sm font-medium">Andamento chiusura ticket</div>
                <div className="mt-3">
                  <TicketTrendChart data={data.closed_trend} dataKey="closed" color="#dc2626" />
                </div>
              </div>

              {isSuperAdmin && (
                <div className="rounded-2xl bg-white p-5 ring-1 ring-zinc-100">
                  <div className="text-sm font-medium">Ticket per categoria </div>
                  <div className="mt-3">
                    <BreakdownPieChart data={data.by_category} nameKey="category" valueKey="count" />
                  </div>
                </div>
              )}

              <div className="rounded-2xl bg-white p-5 ring-1 ring-zinc-100">
                <div className="text-sm font-medium">Ticket per priorita</div>
                <div className="mt-3">
                  <BreakdownPieChart data={data.by_priority} nameKey="priority" valueKey="count" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
