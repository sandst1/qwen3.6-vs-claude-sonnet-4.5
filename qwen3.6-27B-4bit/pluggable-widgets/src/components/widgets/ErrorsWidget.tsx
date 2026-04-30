import { fetchErrorCount, type ErrorCount } from "../../api";
import { registerWidget } from "../../registry";

const ALERT_THRESHOLD = 10;

function ErrorsContent(data: ErrorCount | null) {
  if (!data) return null;
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
  id: "errors",
  title: "Errors",
  subtitle: "last 5 min",
  size: 3,
  interval: 15_000,
  fetch: fetchErrorCount,
  component: ErrorsContent,
});
