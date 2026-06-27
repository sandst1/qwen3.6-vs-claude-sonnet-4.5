import { fetchServiceStatuses } from "../../api";
import { registerWidget } from "../../widgets/widgetRegistry";

function renderServices(data: Awaited<ReturnType<typeof fetchServiceStatuses>>) {
  return (
    <div className="services-grid">
      {data.map((s) => (
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

registerWidget({
  key: "services",
  title: "Services",
  subtitle: "service health",
  columnSpan: 5,
  pollIntervalMs: 30_000,
  fetchData: () => fetchServiceStatuses(),
  render: renderServices,
});