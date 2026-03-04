import Link from "next/link";
import { Ticket } from "@/lib/types";
import { badgeForPriority, cn, formatDate } from "@/lib/utils";

export function TicketTable({ tickets }: { tickets: Ticket[] }) {
  return (
    <div className="overflow-hidden rounded-2xl ring-1 ring-zinc-100">
      <table className="w-full text-sm">
        <thead className="bg-zinc-50 text-zinc-600">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Titolo</th>
            <th className="px-4 py-3 text-left font-medium">Stato</th>
            <th className="px-4 py-3 text-left font-medium">Priorità (ML)</th>
            <th className="px-4 py-3 text-left font-medium">Creato</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr key={t.id} className="border-t border-zinc-100">
              <td className="px-4 py-3">
                <Link className="font-medium text-zinc-900 hover:underline" href={`/tickets/${t.id}`}>
                  {t.title}
                </Link>
                <div className="text-xs text-zinc-500">{t.requester_email}</div>
              </td>
              <td className="px-4 py-3">
                <span className="rounded-lg bg-zinc-100 px-2 py-1 text-xs text-zinc-700">
                  {t.status}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={cn("rounded-lg px-2 py-1 text-xs", badgeForPriority(t.predicted_priority))}>
                  {t.predicted_priority ?? "—"}
                </span>
                {typeof t.confidence === "number" && (
                  <span className="ml-2 text-xs text-zinc-500">{Math.round(t.confidence * 100)}%</span>
                )}
              </td>
              <td className="px-4 py-3 text-zinc-600">{formatDate(t.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}