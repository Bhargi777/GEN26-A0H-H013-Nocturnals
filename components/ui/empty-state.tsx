import type { ReactElement } from "react";

export function EmptyState({ message, action }: { message: string; action: ReactElement }) {
  return <div className="space-y-3 rounded-card border bg-surface p-6"><p>{message}</p>{action}</div>;
}
