import type { HTMLAttributes, ReactElement, ReactNode } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={`rounded-card border bg-surface p-4 ${className}`} />;
}

export interface PageHeaderProps {
  title: string;
  context: string;
  action?: ReactElement;
  children?: ReactNode;
}

export function PageHeader({ title, context, action, children }: PageHeaderProps) {
  return <header className="space-y-4">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 space-y-1"><h1>{title}</h1><p className="text-secondary">{context}</p></div>
      {action}
    </div>
    {children}
  </header>;
}
