import { fetchErrorCount } from "../../api";
import { usePolling } from "../usePolling";
import type { WidgetPlugin } from "../types";

// hardcoded — alert if last 5 min count is over this
const ALERT_THRESHOLD = 10;

function ErrorsBody() {
  const data = usePolling(fetchErrorCount, 15_000);
  if (data == null) return <span className="loading">Loading…</span>;
  return (
    <div style={{ alignItems: "center", justifyContent: "center" }}>
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

const plugin: WidgetPlugin = {
  id: "core.errors",
  title: "Errors",
  subtitle: "last 5 min",
  description: "Big error counter with an alert threshold.",
  defaultSpan: 3,
  component: ErrorsBody,
};

export default plugin;
