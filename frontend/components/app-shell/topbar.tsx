"use client";

import { usePathname } from "next/navigation";
import { Bell, Search, Wallet } from "lucide-react";
import { me } from "@/lib/mock";

function titleForPath(pathname: string): string {
  if (pathname === "/app") return "Dashboard";
  if (pathname === "/app/groups") return "Groups";
  if (pathname === "/app/groups/new") return "Create new group";
  if (pathname.startsWith("/app/groups/")) {
    if (pathname.endsWith("/withdraw")) return "Request withdrawal";
    if (pathname.includes("/requests/")) return "Withdrawal request";
    return "Group detail";
  }
  if (pathname === "/app/profile") return "Reputation profile";
  if (pathname === "/app/agents") return "Agent policies";
  return "Auralis";
}

export function Topbar() {
  const pathname = usePathname();
  const title = titleForPath(pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/70 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-6 px-6 py-4 lg:px-10">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold tracking-tight text-fg sm:text-xl">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden h-10 items-center gap-2 rounded-full border border-border bg-surface/60 px-4 sm:flex">
            <Search className="size-4 text-fg-dim" />
            <input
              type="text"
              placeholder="Search groups, members, requests…"
              className="w-64 bg-transparent text-sm text-fg outline-none placeholder:text-fg-dim"
            />
          </div>

          <button
            type="button"
            aria-label="Notifications"
            className="grid size-10 place-items-center rounded-full border border-border bg-surface/60 text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
          >
            <Bell className="size-4" />
          </button>

          <div className="flex items-center gap-3 rounded-full border border-violet/30 bg-violet/[0.06] py-1.5 pl-2 pr-4">
            <span className="grid size-7 place-items-center rounded-full bg-gradient-to-br from-violet/40 to-emerald/30 text-xs font-medium text-fg">
              {me.name[0]}
            </span>
            <div className="hidden flex-col items-start leading-tight sm:flex">
              <span className="text-[11px] uppercase tracking-wider text-fg-dim">
                {me.tier}
              </span>
              <span className="font-mono text-[11px] text-fg">
                {me.address.slice(0, 6)}…{me.address.slice(-4)}
              </span>
            </div>
            <Wallet className="size-4 text-violet-soft" />
          </div>
        </div>
      </div>
    </header>
  );
}
