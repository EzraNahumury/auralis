"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Plus,
  UserCircle2,
  BrainCircuit,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/cn";

const navItems = [
  { label: "Dashboard", href: "/app", icon: LayoutDashboard },
  { label: "Groups", href: "/app/groups", icon: Users },
  { label: "Create group", href: "/app/groups/new", icon: Plus },
  { label: "Profile", href: "/app/profile", icon: UserCircle2 },
  { label: "Agents", href: "/app/agents", icon: BrainCircuit },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-surface/40 px-4 py-6 backdrop-blur-xl lg:flex">
      <Link
        href="/"
        className="mb-8 flex items-center gap-2 px-2 text-sm font-semibold tracking-tight"
      >
        <span aria-hidden className="grid size-7 place-items-center rounded-full ring-conic">
          <span className="size-5 rounded-full bg-bg" />
        </span>
        <span>Auralis</span>
      </Link>

      <nav className="flex flex-col gap-1">
        <p className="px-2 pb-2 text-[10px] font-medium uppercase tracking-wider text-fg-dim">
          Workspace
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/app"
              ? pathname === "/app"
              : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-colors",
                active
                  ? "border border-violet/30 bg-violet/10 text-fg"
                  : "border border-transparent text-fg-muted hover:bg-white/[0.04] hover:text-fg"
              )}
            >
              <Icon
                className={cn(
                  "size-4 transition-colors",
                  active ? "text-violet-soft" : "text-fg-muted group-hover:text-fg"
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-2xl border border-border bg-bg/40 px-3 py-2.5 text-xs text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to landing</span>
        </Link>

        <div className="rounded-2xl border border-border bg-bg/40 p-3 text-xs text-fg-dim">
          <p className="font-medium text-fg-muted">Portaldot Mainnet</p>
          <p className="mt-1 font-mono text-[10px]">wss://mainnet.portaldot.io</p>
        </div>
      </div>
    </aside>
  );
}
