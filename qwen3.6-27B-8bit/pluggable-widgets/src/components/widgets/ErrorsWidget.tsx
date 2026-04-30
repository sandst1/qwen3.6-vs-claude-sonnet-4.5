import { registry } from "../../plugins/registry";
import type { WidgetDescriptor } from "../../plugins/widget-types";
import { fetchErrorCount, type ErrorCount } from "../../api";
import type { ComponentType } from "react";

const ALERT_THRESHOLD = 10;

function ErrorsBody({ data }: { data: ErrorCount }) {
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

export const errorsWidgetDescriptor: WidgetDescriptor<ErrorCount> = {
  id: "errors",
  title: "Errors",
  subtitle: "last 5 min",
  gridColumnSpan: 3,
  wrapperClass: "widget--errors",
  Component: ErrorsBody as ComponentType<{ data: ErrorCount }>,
  fetchData: fetchErrorCount,
  refreshIntervalMs: 15_000,
};

registry.add(errorsWidgetDescriptor);
