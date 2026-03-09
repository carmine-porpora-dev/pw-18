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
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

const PIE_COLORS = ["#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#a855f7", "#14b8a6"];

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

export function BreakdownPieChart({
  data,
  nameKey,
  valueKey
}: {
  data: Array<Record<string, any>>;
  nameKey: string;
  valueKey: string;
}) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey={valueKey}
            nameKey={nameKey}
            cx="50%"
            cy="50%"
            outerRadius={90}
            label
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
