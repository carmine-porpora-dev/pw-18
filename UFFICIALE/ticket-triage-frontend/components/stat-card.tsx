import { ReactNode } from "react";

export function StatCard({
  title,
  value,
  subtitle,
  right
}: {
  title: string;
  value: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-zinc-100">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-zinc-500">{title}</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>
          {subtitle && <div className="mt-1 text-xs text-zinc-500">{subtitle}</div>}
        </div>
        {right}
      </div>
    </div>
  );
}