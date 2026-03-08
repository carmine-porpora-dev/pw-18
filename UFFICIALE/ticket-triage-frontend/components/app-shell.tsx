"use client";

import { ReactNode, useEffect, useState } from "react";
import { Nav } from "./nav";

export function AppShell({ children }: { children: ReactNode }) {
  const [groupName, setGroupName] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!mounted || !data) return;
        const label = data.is_super_admin === 1 ? "Super Admin" : data.group_name;
        setGroupName(typeof label === "string" ? label : null);
      })
      .catch(() => {
        setGroupName(null);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xl font-semibold tracking-tight">
              {groupName ? `${groupName} - ` : ""}Help Desk
            </div>
          </div>
          <Nav />
        </div>

        <div className="mt-6 rounded-2xl bg-white shadow-soft ring-1 ring-zinc-100">
          <div className="p-5 md:p-7">{children}</div>
        </div>

        <div className="mt-6 text-xs text-zinc-400">
          © {new Date().getFullYear()} Carmine Porpora
        </div>
      </div>
    </div>
  );
}
