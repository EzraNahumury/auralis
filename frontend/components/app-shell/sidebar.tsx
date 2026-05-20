"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const nav = [
  { label: "Home", href: "/app" },
  { label: "Group", href: "/app/groups/g_rt03" },
  { label: "Send", href: "/app/groups/g_rt03/withdraw" },
  { label: "Profile", href: "/app/profile" },
  { label: "Agent", href: "/app/agents" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-[220px] shrink-0 flex-col justify-between border-r border-border bg-bg px-5 py-7 lg:flex">
      <div>
        <Link href="/" className="block">
          <p className="text-[15px] font-semibold tracking-tight text-fg">
            Auralis
          </p>
          <p className="mt-0.5 text-[11px] text-fg-dim">Arisan, on chain.</p>
        </Link>

        <nav className="mt-12 flex flex-col gap-0.5">
          {nav.map((item) => {
            const active =
              item.href === "/app"
                ? pathname === "/app"
                : pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between rounded-md px-3 py-2 text-[14px] transition-colors",
                  active
                    ? "bg-white/[0.06] text-fg"
                    : "text-fg-muted hover:bg-white/[0.03] hover:text-fg"
                )}
              >
                <span>{item.label}</span>
                {active && (
                  <span className="size-1 rounded-full bg-fg" aria-hidden />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-2 text-[12px] text-fg-dim">
        <Link
          href="/"
          className="rounded-md px-3 py-2 transition-colors hover:bg-white/[0.03] hover:text-fg"
        >
          ← Back to site
        </Link>
        <a
          href="https://github.com/EzraNahumury/auralis"
          target="_blank"
          rel="noreferrer"
          className="rounded-md px-3 py-2 transition-colors hover:bg-white/[0.03] hover:text-fg"
        >
          GitHub ↗
        </a>
      </div>
    </aside>
  );
}
