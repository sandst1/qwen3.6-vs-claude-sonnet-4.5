import { useEffect, useState } from "react";
import { fetchServiceStatuses, type ServiceStatus } from "../../api";
import type { WidgetDef } from "../../widgets/types";

export function ServicesWidget() {
  const [services, setServices] = useState<ServiceStatus[] | null>(null);

  useEffect(() => {
    fetchServiceStatuses().then(setServices);
    const id = setInterval(() => fetchServiceStatuses().then(setServices), 30_000);
    return () => clearInterval(id);
  }, []);

  return services == null ? (
    <span className="loading">Loading…</span>
  ) : (
    <div className="services-body">
      <div className="services-count">{services.length} services tracked</div>
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
    </div>
  );
}

export const servicesWidget: WidgetDef = {
  id: "services",
  title: "Services",
  span: 5,
  component: ServicesWidget,
};
