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

Widgets live in a 12-column CSS grid. Each widget's width is a `span`
(1-12) declared in its registry entry, not in CSS.

| Widget       | File                                           | Cols |
| ------------ | ---------------------------------------------- | ---- |
| Summary      | `src/components/widgets/StatsWidget.tsx`       | 3    |
| Latency      | `src/components/widgets/LatencyWidget.tsx`     | 6    |
| Errors       | `src/components/widgets/ErrorsWidget.tsx`      | 3    |
| Activity     | `src/components/widgets/ActivityWidget.tsx`    | 7    |
| Services     | `src/components/widgets/ServicesWidget.tsx`    | 5    |

Each widget fetches its own data from `src/api.ts` and polls on its own
interval.

## User customization

Users can customize the dashboard via the "Customize layout" bar:

- **Add / remove** widgets (one instance of each type).
- **Reorder** widgets by dragging the ⠿ handle in customize mode
  (native HTML5 drag & drop, no library).
- **Reset** back to the default layout.

The layout (which widgets, in what order) is persisted to `localStorage`
under `ops-dashboard.layout.v1` and survives reloads. State lives in
`src/widgets/useLayout.ts`; stale/unknown widget ids in stored layouts are
filtered out on load.

## Adding a new widget type

1. Create a component in `src/components/widgets/`, e.g. `CpuWidget.tsx`.
   It renders a full `.widget` card (header + body) and fetches/polls its
   own data, like the existing widgets.
2. Register it in `src/widgets/registry.ts`:

   ```ts
   registerWidget({ id: "cpu", title: "CPU", span: 3, component: CpuWidget });
   ```

That's it — it appears in the add-widget palette, and its span controls its
grid width. The id must be stable: it's part of persisted user layouts.

## Mock backend

`src/api.ts` returns fake data with simulated latency. Swap for real `fetch`
calls when wiring to the backend.
