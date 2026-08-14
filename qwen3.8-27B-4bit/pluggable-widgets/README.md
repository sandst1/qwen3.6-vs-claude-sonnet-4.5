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

## Pluggable widgets

The dashboard is driven by a **widget registry**. Each widget registers itself
with a metadata record (`id`, `name`, `defaultSpan`, `component`). The
dashboard renders whatever is in the user's layout, in the user's order.

### User customization

Click **Customize** in the header to:

- Add or remove widgets from the dashboard
- Reorder widgets (up / down)
- Reset to the default layout

The layout is persisted to `localStorage`, so it survives page reloads.

### Adding a new widget

1. Create a self-contained React component in `src/components/widgets/`.
   It should render its own `.widget` card (header + body) and fetch its own
   data.

2. Register it in `src/widgets/index.ts`:

   ```ts
   createWidget("my-widget", "My Widget", MyWidget, 6, "Optional description");
   ```

   - `id` — unique string key used in the layout
   - `name` — display name in the customize panel
   - `component` — the React component
   - `defaultSpan` — grid columns (1–12) when first added
   - `description` — optional, shown in the "add a widget" list

That's it. The widget will appear in the customize panel and can be added,
removed, and reordered by users.

### Built-in widgets

| Widget       | File                                           | Default span |
| ------------ | ---------------------------------------------- | ------------ |
| Summary      | `src/components/widgets/StatsWidget.tsx`       | 3            |
| Latency      | `src/components/widgets/LatencyWidget.tsx`     | 6            |
| Errors       | `src/components/widgets/ErrorsWidget.tsx`      | 3            |
| Activity     | `src/components/widgets/ActivityWidget.tsx`    | 7            |
| Services     | `src/components/widgets/ServicesWidget.tsx`    | 5            |

### Layout system

- `src/widgets/types.ts` — `WidgetDef` and `WidgetPlacement` types
- `src/widgets/registry.ts` — registration + lookup
- `src/widgets/useDashboardLayout.ts` — layout state + localStorage persistence
- `src/components/DashboardGrid.tsx` — renders placements from the registry
- `src/components/CustomizePanel.tsx` — add / remove / reorder UI

## Mock backend

`src/api.ts` returns fake data with simulated latency. Swap for real `fetch`
calls when wiring to the backend.
