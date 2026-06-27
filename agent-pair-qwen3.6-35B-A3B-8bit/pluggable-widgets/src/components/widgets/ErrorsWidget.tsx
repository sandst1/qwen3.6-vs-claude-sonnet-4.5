import { fetchErrorCount } from "../../api";
import { registerWidget } from "../../widgets/widgetRegistry";

const ALERT_THRESHOLD = 10;

function renderErrors(data: Awaited<ReturnType<typeof fetchErrorCount>>) {
  return (
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
  );
}

registerWidget({
  key: "errors",
  title: "Errors",
  subtitle: "last 5 min",
  columnSpan: 3,
  pollIntervalMs: 15_000,
  fetchData: () => fetchErrorCount(),
  render: renderErrors,
});