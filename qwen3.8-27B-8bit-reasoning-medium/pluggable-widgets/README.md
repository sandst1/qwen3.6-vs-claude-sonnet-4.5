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

Widgets live in a 12-column CSS grid. Users can remove a widget (× in its
header), add widgets back (dashed "Add widget" tile), and drag widget headers
to reorder. The layout is persisted per-browser in `localStorage`
(`ops-dashboard.layout.v1`); "Reset layout" in the header restores the
defaults.

| Widget       | File                                           | Cols |
| ------------ | ---------------------------------------------- | ---- |
| Summary      | `src/components/widgets/StatsWidget.tsx`       | 3    |
| Latency      | `src/components/widgets/LatencyWidget.tsx`     | 6    |
| Errors       | `src/components/widgets/ErrorsWidget.tsx`      | 3    |
| Activity     | `src/components/widgets/ActivityWidget.tsx`    | 7    |
| Services     | `src/components/widgets/ServicesWidget.tsx`    | 5    |

Each widget fetches its own data from `src/api.ts` and polls on its own
interval.

## Adding a new widget type

Widgets are pluggable. To add one:

1. Create the body component in `src/components/widgets/<Name>Widget.tsx`.
   It renders only the content — the card chrome (header, drag handle,
   remove button) comes from the shared `WidgetCard`.
2. Export a `WidgetDef` from the same file: `id`, `title`, `span`
   (grid columns, out of 12), `component`, optional `subtitle`.
3. Add the def to the list in `src/widgets/registry.ts`.

That's all that's needed — the dashboard renders it, the add-widget menu
offers it, and it supports drag-to-reorder and remove automatically.

## Mock backend

`src/api.ts` returns fake data with simulated latency. Swap for real `fetch`
calls when wiring to the backend.
