"use client";

import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";

export function OpenedTrendChart({ data }: { data: Array<{ date: string; opened: number }> }) {
  return <TicketTrendChart data={data} dataKey="opened" color="#18181b" />;
}

export function TicketTrendChart({
  data,
  dataKey,
  color = "#18181b"
}: {
  data: Array<Record<string, any>>;
  dataKey: string;
  color?: string;
}) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
          <Tooltip />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BreakdownBarChart({
  data,
  xKey,
  barKey
}: {
  data: Array<Record<string, any>>;
  xKey: string;
  barKey: string;
}) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
          <Tooltip />
          <Bar dataKey={barKey} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
