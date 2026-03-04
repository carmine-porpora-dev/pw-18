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
            Fornisci i dettagli necessari, descrivi dettagliatamente il tuo problema.
          </div>
        </div>
      </div>

      <div className="mt-5">
        <TicketForm onCreated={(t) => router.push(`/tickets/${t.id}`)} />
      </div>
    </AppShell>
  );
}