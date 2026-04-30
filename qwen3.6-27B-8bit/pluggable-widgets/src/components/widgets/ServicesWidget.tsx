import { registry } from "../../plugins/registry";
import type { WidgetDescriptor } from "../../plugins/widget-types";
import { fetchServiceStatuses, type ServiceStatus } from "../../api";
import type { ComponentType } from "react";

function ServicesBody({ data }: { data: ServiceStatus[] }) {
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

export const servicesWidgetDescriptor: WidgetDescriptor<ServiceStatus[]> = {
  id: "services",
  title: "Services",
  subtitle: "6 tracked",
  gridColumnSpan: 5,
  wrapperClass: "widget--services",
  Component: ServicesBody as ComponentType<{ data: ServiceStatus[] }>,
  fetchData: fetchServiceStatuses,
  refreshIntervalMs: 30_000,
};

registry.add(servicesWidgetDescriptor);
