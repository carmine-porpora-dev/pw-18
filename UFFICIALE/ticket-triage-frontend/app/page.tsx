import Link from "next/link";
import { AppShell } from "@/components/app-shell";

export default function Home() {
  return (
    <AppShell>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-zinc-50 p-5 ring-1 ring-zinc-100">
          <div className="text-lg font-semibold">Operatività</div>
          <p className="mt-1 text-sm text-zinc-600">
            Apri ticket e fai triage automatico con il tuo modello ML ad ogni creazione.
          </p>
          <div className="mt-4 flex gap-2">
            <Link className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white" href="/tickets/new">
              Apri ticket
            </Link>
            <Link className="rounded-xl bg-white px-4 py-2 text-sm ring-1 ring-zinc-200" href="/tickets">
              Lista ticket
            </Link>
          </div>
        </div>

        <div className="rounded-2xl bg-zinc-50 p-5 ring-1 ring-zinc-100">
          <div className="text-lg font-semibold">Reportistica</div>
          <p className="mt-1 text-sm text-zinc-600">
            Dashboard con incidenti ultimi 30 giorni, trend apertura e breakdown.
          </p>
          <div className="mt-4">
            <Link className="rounded-xl bg-white px-4 py-2 text-sm ring-1 ring-zinc-200" href="/dashboard">
              Vai alla dashboard
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}