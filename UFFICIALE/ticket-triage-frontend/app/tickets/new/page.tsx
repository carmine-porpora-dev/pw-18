"use client";

import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { TicketForm } from "@/components/ticket-form";

export default function NewTicketPage() {
  const router = useRouter();

  return (
    <AppShell>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-semibold">Apri un ticket</div>
          <div className="text-sm text-zinc-500">
            Alla creazione, il backend richiama il modello ML e salva categoria/priorità suggerite.
          </div>
        </div>
      </div>

      <div className="mt-5">
        <TicketForm onCreated={(t) => router.push(`/tickets/${t.id}`)} />
      </div>
    </AppShell>
  );
}