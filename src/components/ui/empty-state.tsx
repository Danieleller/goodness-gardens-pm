import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
        style={{ background: "var(--surface-2)" }}
      >
        {icon}
      </div>
      <p className="text-sm font-medium" style={{ color: "var(--text-2)" }}>{title}</p>
      {description && (
        <p className="text-xs mt-1 text-center max-w-[280px]" style={{ color: "var(--text-3)" }}>{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
