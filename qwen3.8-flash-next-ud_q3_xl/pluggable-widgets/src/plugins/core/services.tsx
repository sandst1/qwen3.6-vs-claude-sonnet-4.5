import { fetchServiceStatuses } from "../../api";
import { usePolling } from "../usePolling";
import type { WidgetPlugin } from "../types";

function ServicesBody() {
  const services = usePolling(fetchServiceStatuses, 30_000);
  if (services == null) return <span className="loading">Loading…</span>;
  return (
    <div className="services-grid">
      {services.map((s) => (
        <div key={s.name} className="service-cell">
          <span className="service-name">{s.name}</span>
          <span className={`service-status ${s.status}`}>
            {s.status} · {s.uptime}
          </span>
        </div>
      ))}
    </div>
  );
}

const plugin: WidgetPlugin = {
  id: "core.services",
  title: "Services",
  subtitle: "tracked",
  description: "Health and uptime of every tracked service.",
  defaultSpan: 5,
  component: ServicesBody,
};

export default plugin;
