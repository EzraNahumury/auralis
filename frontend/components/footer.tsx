import Link from "next/link";
import { footer } from "@/lib/content";

export function Footer() {
  return (
    <footer className="border-t border-border bg-bg/60">
      <div className="mx-auto grid max-w-[1300px] gap-12 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4 lg:px-10">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span aria-hidden className="grid size-7 place-items-center rounded-full ring-conic">
              <span className="size-5 rounded-full bg-bg" />
            </span>
            <span className="text-sm font-semibold">{footer.brand}</span>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-fg-muted">{footer.tagline}</p>
          <p className="mt-4 text-xs text-fg-dim">
            Built for Portaldot Mini Hackathon · S1 · 2026
          </p>
        </div>

        {footer.columns.map((col) => (
          <div key={col.title} className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-fg">
              {col.title}
            </h4>
            <ul className="flex flex-col gap-2">
              {col.links.map((l) => {
                const external = /^https?:/.test(l.href);
                const Component = external ? "a" : Link;
                return (
                  <li key={l.href}>
                    <Component
                      href={l.href as never}
                      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
                      className="text-sm text-fg-muted transition-colors hover:text-fg"
                    >
                      {l.label}
                    </Component>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-[1300px] flex-col items-start justify-between gap-3 px-6 py-6 text-xs text-fg-dim sm:flex-row sm:items-center lg:px-10">
          <p>© 2026 Auralis. MIT-licensed core contracts.</p>
          <p>POT-gas only. ink! 5.x. substrate-interface.</p>
        </div>
      </div>
    </footer>
  );
}
