import { useEffect, useState } from "react";

export function UptimeWidget() {
  const [uptime, setUptime] = useState<string>("—");

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const secs = Math.floor((Date.now() - start) / 1000);
      const h = String(Math.floor(secs / 3600)).padStart(2, "0");
      const m = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
      const s = String(secs % 60).padStart(2, "0");
      setUptime(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="widget widget--uptime">
      <div className="widget-header">
        <span className="widget-title">Uptime</span>
        <span className="widget-subtitle">session</span>
      </div>
      <div className="widget-body" style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 32, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
          {uptime}
        </div>
      </div>
    </div>
  );
}
