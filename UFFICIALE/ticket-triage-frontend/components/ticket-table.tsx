import Link from "next/link";
import { Ticket } from "@/lib/types";
import { badgeForPriority, cn, formatDate } from "@/lib/utils";

type TicketTableProps = {
  tickets: Ticket[];
  selectable?: boolean;
  selectedIds?: string[];
  onToggleTicket?: (ticketId: string) => void;
  onToggleAll?: () => void;
};

export function TicketTable({
  tickets,
  selectable = false,
  selectedIds = [],
  onToggleTicket,
  onToggleAll
}: TicketTableProps) {
  const allSelected = tickets.length > 0 && tickets.every((ticket) => selectedIds.includes(ticket.id));

  return (
    <div className="overflow-hidden rounded-2xl ring-1 ring-zinc-100">
      <table className="w-full text-sm">
        <thead className="bg-zinc-50 text-zinc-600">
          <tr>
            {selectable && (
              <th className="w-12 px-4 py-3 text-left font-medium">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={() => onToggleAll?.()}
                  aria-label="Seleziona tutti i ticket del gruppo"
                />
              </th>
            )}
            <th className="px-4 py-3 text-left font-medium">Ticket</th>
            <th className="px-4 py-3 text-left font-medium">Stato</th>
            <th className="px-4 py-3 text-left font-medium">Priorita</th>
            <th className="px-4 py-3 text-left font-medium">Creato</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr key={t.id} className="border-t border-zinc-100">
              {selectable && (
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(t.id)}
                    onChange={() => onToggleTicket?.(t.id)}
                    aria-label={`Seleziona ticket ${t.id}`}
                  />
                </td>
              )}
              <td className="px-4 py-3">
                <Link className="font-medium text-zinc-900 hover:underline" href={`/tickets/${t.id}`}>
                  {t.description.slice(0, 70) || `Ticket ${t.id}`}
                </Link>
              </td>
              <td className="px-4 py-3">
                <span className="rounded-lg bg-zinc-100 px-2 py-1 text-xs text-zinc-700">
                  {t.status}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={cn("rounded-lg px-2 py-1 text-xs", badgeForPriority(t.priority))}>
                  {t.priority ?? "-"}
                </span>
              </td>
              <td className="px-4 py-3 text-zinc-600">{formatDate(t.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
