import { useEffect, useState } from "react";
import { fetchServiceStatuses, type ServiceStatus } from "../../api";
import { registerWidget } from "../../lib";

export function ServicesWidget() {
  const [services, setServices] = useState<ServiceStatus[] | null>(null);

  useEffect(() => {
    fetchServiceStatuses().then(setServices);
    const id = setInterval(() => fetchServiceStatuses().then(setServices), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="widget-body">
      <div className="widget-body__subtitle">
        {services ? `${services.length} services tracked` : ""}
      </div>
      {services == null ? (
        <span className="loading">Loading…</span>
      ) : (
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
      )}
    </div>
  );
}

registerWidget({
  id: "services",
  title: "Services",
  component: ServicesWidget,
  gridColumnSpan: 5,
});
