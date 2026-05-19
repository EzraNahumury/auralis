import { Badge } from "../ui/badge";

type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
};

export function PageHeader({ eyebrow, title, description, actions }: Props) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-3">
        {eyebrow && <Badge tone="violet">{eyebrow}</Badge>}
        <h2 className="display text-3xl font-semibold text-fg sm:text-4xl">{title}</h2>
        {description && (
          <p className="max-w-2xl text-sm leading-relaxed text-fg-muted">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}
