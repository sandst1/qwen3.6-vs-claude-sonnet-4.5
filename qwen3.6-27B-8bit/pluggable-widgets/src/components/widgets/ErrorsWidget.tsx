import { useEffect, useState } from "react";
import { fetchErrorCount, type ErrorCount } from "../../api";
import { registerWidget } from "../../lib";

// hardcoded — alert if last 5 min count is over this
const ALERT_THRESHOLD = 10;

export function ErrorsWidget() {
  const [data, setData] = useState<ErrorCount | null>(null);

  useEffect(() => {
    fetchErrorCount().then(setData);
    const id = setInterval(() => fetchErrorCount().then(setData), 15_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="widget-body" style={{ alignItems: "center", justifyContent: "center" }}>
      {data == null ? (
        <span className="loading">Loading…</span>
      ) : (
        <>
          <div
            className="error-big"
            style={{ color: data.last5min >= ALERT_THRESHOLD ? "var(--bad)" : "var(--text)" }}
          >
            {data.last5min}
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: 11, marginTop: 6 }}>
            {data.last1hr} in last hour
          </div>
        </>
      )}
    </div>
  );
}

registerWidget({
  id: "errors",
  title: "Errors",
  subtitle: "last 5 min",
  component: ErrorsWidget,
  gridColumnSpan: 3,
});
