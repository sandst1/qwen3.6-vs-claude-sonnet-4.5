import { useEffect, useState } from "react";
import { fetchErrorCount, type ErrorCount } from "../../api";
import type { WidgetDef } from "../../widgets/types";

// hardcoded — alert if last 5 min count is over this
const ALERT_THRESHOLD = 10;

export function ErrorsWidget() {
  const [data, setData] = useState<ErrorCount | null>(null);

  useEffect(() => {
    fetchErrorCount().then(setData);
    const id = setInterval(() => fetchErrorCount().then(setData), 15_000);
    return () => clearInterval(id);
  }, []);

  return data == null ? (
    <span className="loading">Loading…</span>
  ) : (
    <div className="errors-body">
      <div
        className="error-big"
        style={{ color: data.last5min >= ALERT_THRESHOLD ? "var(--bad)" : "var(--text)" }}
      >
        {data.last5min}
      </div>
      <div style={{ color: "var(--text-muted)", fontSize: 11, marginTop: 6 }}>
        {data.last1hr} in last hour
      </div>
    </div>
  );
}

export const errorsWidget: WidgetDef = {
  id: "errors",
  title: "Errors",
  subtitle: "last 5 min",
  span: 3,
  component: ErrorsWidget,
};
