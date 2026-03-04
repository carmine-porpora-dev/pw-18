"use client";

import { ReactNode } from "react";
import { Nav } from "./nav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xl font-semibold tracking-tight">Ticket Triage</div>
            <div className="text-sm text-zinc-500">UI operativa per ticket + report + ML triage</div>
          </div>
          <Nav />
        </div>

        <div className="mt-6 rounded-2xl bg-white shadow-soft ring-1 ring-zinc-100">
          <div className="p-5 md:p-7">{children}</div>
        </div>

        <div className="mt-6 text-xs text-zinc-400">
          © {new Date().getFullYear()} Ticket Triage
        </div>
      </div>
    </div>
  );
}