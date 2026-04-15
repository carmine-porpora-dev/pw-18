"use client";

import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { ClientSessionUser } from "@/lib/client/session-user";
import type { Ticket } from "@/lib/types";

type ResolveTicketButtonProps = {
  ticket: Ticket;
  me: ClientSessionUser | null;
  onResolved?: (ticket: Ticket) => void;
  variant?: "primary" | "secondary" | "detail";
};

function canResolveTicket(ticket: Ticket, me: ClientSessionUser | null) {
  if (!me || ticket.status === "closed") return false;
  if (me.is_super_admin === 1) return true;
  if (ticket.assigned_user_id != null) return ticket.assigned_user_id === me.id;
  return typeof me.group_id === "number" && ticket.assigned_group_id === me.group_id;
}

export function ResolveTicketButton({
  ticket,
  me,
  onResolved,
  variant = "secondary"
}: ResolveTicketButtonProps) {
  const [open, setOpen] = useState(false);
  const [closureReason, setClosureReason] = useState("");
  const [actionsTaken, setActionsTaken] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isVisible = useMemo(() => canResolveTicket(ticket, me), [ticket, me]);

  if (!isVisible) return null;

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      const updatedTicket = await api.resolveTicket(ticket.id, {
        closure_reason: closureReason,
        actions_taken: actionsTaken
      });
      setOpen(false);
      setClosureReason("");
      setActionsTaken("");
      onResolved?.(updatedTicket);
    } catch (e: any) {
      setError(e?.message ?? "Errore durante la chiusura del ticket");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setOpen(false);
    setClosureReason("");
    setActionsTaken("");
    setError(null);
  }

  const buttonClassName =
    variant === "primary"
      ? "rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
      : variant === "detail"
        ? "inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-zinc-900 via-slate-800 to-zinc-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:from-slate-800 hover:via-zinc-800 hover:to-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
      : "rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50";

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={buttonClassName}>
        Risolvi
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-zinc-200">
            <div className="text-lg font-semibold text-zinc-900">Chiudi ticket {ticket.id}</div>
            <div className="mt-1 text-sm text-zinc-500">
              Inserisci la causale di chiusura e le azioni effettuate.
            </div>

            <div className="mt-5 grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-zinc-800">Causale di chiusura</span>
                <textarea
                  value={closureReason}
                  onChange={(event) => setClosureReason(event.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
                  placeholder="Descrivi la soluzione applicata e il motivo della chiusura"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-zinc-800">Azioni effettuate</span>
                <textarea
                  value={actionsTaken}
                  onChange={(event) => setActionsTaken(event.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
                  placeholder="Elenca i passaggi eseguiti per risolvere l'incident"
                />
              </label>

              {error && (
                <div className="rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">
                  {error}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {saving ? "Salvataggio..." : "Salva"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
