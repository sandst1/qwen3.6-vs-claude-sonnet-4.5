import { fetchServiceStatuses, type ServiceStatus } from "../../api";
import { registerWidget } from "../../registry";

function ServicesContent(data: ServiceStatus[] | null) {
  if (!data) return null;
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
  id: "services",
  title: "Services",
  subtitle: (services) => (services ? `${services.length} tracked` : ""),
  size: 5,
  interval: 30_000,
  fetch: fetchServiceStatuses,
  component: ServicesContent,
});
