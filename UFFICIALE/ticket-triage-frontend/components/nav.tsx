"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, ListChecks, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/tickets", label: "Ticket", icon: ListChecks },
  { href: "/tickets/new", label: "Apri ticket", icon: PlusCircle },
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 }
];

export function Nav() {
  const path = usePathname();

  return (
    <nav className="flex items-center gap-2">
      {items.map((it) => {
        const active = path === it.href;
        const Icon = it.icon;
        return (
          <Link
            key={it.href}
            href={it.href}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm ring-1 transition",
              active
                ? "bg-zinc-900 text-white ring-zinc-900"
                : "bg-white text-zinc-700 ring-zinc-200 hover:bg-zinc-50"
            )}
          >
            <Icon size={16} />
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}