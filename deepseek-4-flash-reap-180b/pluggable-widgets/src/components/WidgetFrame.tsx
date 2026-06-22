import type { ReactNode } from "react";
import { useDashboard } from "../DashboardContext";

export function WidgetFrame({
  index,
  total,
  title,
  subtitle,
  children,
}: {
  index: number;
  total: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const { removeWidget, moveWidget } = useDashboard();

  return (
    <div className="widget">
      <div className="widget-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="widget-title">{title}</span>
          {subtitle && <span className="widget-subtitle">{subtitle}</span>}
        </div>
        <span className="widget-actions">
          <button
            className="act-btn"
            title="Move up"
            disabled={index === 0}
            onClick={() => moveWidget(index, -1)}
          >
            ▲
          </button>
          <button
            className="act-btn"
            title="Move down"
            disabled={index === total - 1}
            onClick={() => moveWidget(index, 1)}
          >
            ▼
          </button>
          <button
            className="act-btn act-btn--remove"
            title="Remove widget"
            onClick={() => removeWidget(index)}
          >
            x
          </button>
        </span>
      </div>
      <div className="widget-body">
        {children}
      </div>
    </div>
  );
}
