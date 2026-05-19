import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";

type Props = {
  href: string;
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
  withArrow?: boolean;
  external?: boolean;
};

const styles: Record<Variant, string> = {
  primary:
    "bg-fg text-bg hover:bg-violet-soft hover:text-bg shadow-[0_10px_30px_-12px_rgba(124,108,255,0.55)]",
  secondary:
    "bg-white/[0.04] text-fg border border-border-strong hover:bg-white/[0.08] hover:border-violet/40 backdrop-blur",
  ghost:
    "text-fg-muted hover:text-fg",
};

export function Button({
  href,
  children,
  variant = "primary",
  className,
  withArrow = false,
  external = false,
}: Props) {
  const isHash = href.startsWith("#");
  const Component = isHash ? "a" : Link;
  const externalProps =
    external || /^https?:/.test(href)
      ? { target: "_blank", rel: "noreferrer" }
      : {};

  return (
    <Component
      href={href as never}
      {...externalProps}
      className={cn(
        "group inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium",
        "transition-all duration-300 ease-out",
        "will-change-transform hover:-translate-y-[1px] active:translate-y-0",
        styles[variant],
        className
      )}
    >
      <span>{children}</span>
      {withArrow && (
        <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
      )}
    </Component>
  );
}
