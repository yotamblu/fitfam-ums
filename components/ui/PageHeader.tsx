import type { ReactNode } from "react";

export default function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-headline-lg font-extrabold tracking-tight">{title}</h1>
        {description && <p className="max-w-xl text-body-lg text-text-secondary">{description}</p>}
      </div>
      {actions}
    </div>
  );
}
