import { cn } from "@/lib/cn";
import { Badge } from "./badge";

type Props = {
  eyebrow?: string;
  title: string;
  body?: string;
  align?: "left" | "center";
  tone?: "violet" | "emerald";
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  body,
  align = "left",
  tone = "violet",
  className,
}: Props) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5",
        align === "center" && "items-center text-center",
        className
      )}
    >
      {eyebrow && (
        <div data-anim="fade-up">
          <Badge tone={tone}>{eyebrow}</Badge>
        </div>
      )}
      <h2
        data-anim="fade-up"
        className={cn(
          "display text-3xl font-semibold text-fg sm:text-4xl lg:text-5xl",
          align === "center" ? "max-w-3xl" : "max-w-2xl"
        )}
      >
        {title}
      </h2>
      {body && (
        <p
          data-anim="fade-up"
          className={cn(
            "text-base leading-relaxed text-fg-muted sm:text-lg",
            align === "center" ? "max-w-2xl" : "max-w-2xl"
          )}
        >
          {body}
        </p>
      )}
    </div>
  );
}
