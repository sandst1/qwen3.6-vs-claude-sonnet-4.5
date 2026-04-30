# ops-dashboard

Internal ops dashboard. Shows production health metrics, recent activity, and
service status at a glance.

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:5173.

## Stack

- Vite + React 18 + TypeScript
- Recharts for the latency chart
- Plain CSS (no Tailwind / no styled-components)

## Layout

Five widgets in a 12-column CSS grid:

| Widget       | File                                           | Cols |
| ------------ | ---------------------------------------------- | ---- |
| Summary      | `src/components/widgets/StatsWidget.tsx`       | 3    |
| Latency      | `src/components/widgets/LatencyWidget.tsx`     | 6    |
| Errors       | `src/components/widgets/ErrorsWidget.tsx`      | 3    |
| Activity     | `src/components/widgets/ActivityWidget.tsx`    | 7    |
| Services     | `src/components/widgets/ServicesWidget.tsx`    | 5    |

Each widget fetches its own data from `src/api.ts` and polls on its own
interval.

## Mock backend

`src/api.ts` returns fake data with simulated latency. Swap for real `fetch`
calls when wiring to the backend.
