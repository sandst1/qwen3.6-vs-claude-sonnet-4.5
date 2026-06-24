import { useEffect, useState } from "react";
import { fetchServiceStatuses, type ServiceStatus } from "../../api";
import { registry } from "../../lib/widget-registry";
import type { WidgetType } from "../../lib/widget-schema";

export function ServicesWidget() {
  const [services, setServices] = useState<ServiceStatus[] | null>(null);

  useEffect(() => {
    fetchServiceStatuses().then(setServices);
    const id = setInterval(() => fetchServiceStatuses().then(setSets), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="widget widget--services">
      <div className="widget-header">
        <span className="widget-title">Services</span>
        <span className="widget-subtitle">{services ? `${services.length} tracked` : ""}</span>
      </div>
      <div className="widget-body">
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
    </div>
  );
}

const servicesConfig: WidgetType = {
  id: "services",
  title: "Services",
  subtitle: "tracked services",
  size: "small",
  Component: ServicesWidget,
};

registry.register(servicesConfig);
