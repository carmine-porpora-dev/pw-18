"use client";

import { useState } from "react";
import { z } from "zod";
import { api } from "@/lib/api";
import { CreateTicketInput, Ticket } from "@/lib/types";

const schema = z.object({
  title: z.string().min(4, "Titolo troppo corto"),
  description: z.string().min(10, "Descrizione troppo corta")
});

export function TicketForm({ onCreated }: { onCreated: (t: Ticket) => void }) {
  const [payload, setPayload] = useState<CreateTicketInput>({
    title: "",
    description: ""
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(null);
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dati non validi");
      return;
    }

    try {
      setLoading(true);
      // Qui il backend dovrebbe:
      // 1) chiamare il tuo modello ML (POST /api/triage/predict internamente o direttamente in create)
      // 2) salvare predicted_priority/category/confidence nel ticket
      const created = await api.createTicket(payload);
      onCreated(created);
    } catch (e: any) {
      setError(e?.message ?? "Errore");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white">
      <div className="grid gap-4">
        <div>
          <label className="text-sm font-medium">Titolo</label>
          <input
            className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-900/10"
            value={payload.title}
            onChange={(e) => setPayload((p) => ({ ...p, title: e.target.value }))}
            placeholder="Es. Errore login SSO"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Descrizione</label>
          <textarea
            className="mt-1 min-h-[120px] w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-900/10"
            value={payload.description}
            onChange={(e) => setPayload((p) => ({ ...p, description: e.target.value }))}
            placeholder="Dettagli, impatto, riproducibilità..."
          />
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">
            {error}
          </div>
        )}

        <button
          onClick={submit}
          disabled={loading}
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          {loading ? "Creazione..." : "Crea ticket (triage ML)"}
        </button>
      </div>
    </div>
  );
}
