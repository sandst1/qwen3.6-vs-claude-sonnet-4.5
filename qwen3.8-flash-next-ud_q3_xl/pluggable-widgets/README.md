# ops-dashboard

Internal ops dashboard. Shows production health metrics, recent activity, and
service status at a glance. Users can customize their dashboard — add, remove,
reorder, and resize widgets — and their layout is saved per browser.

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
- No extra dependencies for customization (native HTML5 drag & drop)

## Architecture

The dashboard is **pluggable**: widget *types* are registered in a central
registry; each user's dashboard is a *layout* of widget *instances* referencing
those types.

```
src/
  plugins/
    types.ts        WidgetPlugin interface, grid-span helpers
    registry.ts     WidgetRegistry (register / get / list)
    index.ts        registers all built-in widgets  ← add new types here
    usePolling.ts   shared fetch-on-interval hook
    core/           built-in widget plugins, one file each
      stats.tsx  latency.tsx  errors.tsx  activity.tsx  services.tsx
  dashboard/
    layout.ts               layout model + localStorage persistence + reducers
    useDashboardLayout.ts   React state wrapper
    WidgetFrame.tsx         card chrome: header, controls, drag handling
    DashboardGrid.tsx       renders layout → frames, drag-reorder wiring
    WidgetCatalog.tsx       "Add widget" drawer
  App.tsx                   Customize / Done, catalog, grid
```

Key contracts:

- A **widget plugin** declares `id` (stable, namespaced — persisted in user
  layouts, never rename), `title`, `description` (catalog), `defaultSpan` /
  `allowedSpans` (12-col grid), and a `component` that renders only the widget
  *body*. The shell (`WidgetFrame`) renders the card, header, and all
  customization controls — widgets never do.
- Widget components receive `{ instanceId, span }`. `instanceId` is unique per
  layout instance, so the same widget type can appear multiple times and can
  later grow per-instance configuration.
- Widgets own their data fetching (`usePolling` + a function from `api.ts`).
  The shell knows nothing about data sources.
- The **layout** is `{ version, widgets: [{ id, type, span? }] }`, persisted to
  `localStorage` under `ops-dashboard.layout.v1`. On load, instances whose type
  isn't in the registry are silently dropped (safe to remove a plugin later);
  corrupt data falls back to the default layout.

## Adding a new widget type

1. Create `src/plugins/core/<name>.tsx`:

   ```tsx
   import type { WidgetPlugin } from "../types";
   import { usePolling } from "../usePolling";
   import { fetchThing } from "../../api";

   function ThingBody() {
     const data = usePolling(fetchThing, 30_000);
     if (data == null) return <span className="loading">Loading…</span>;
     return <p>{data.value}</p>;
   }

   const plugin: WidgetPlugin = {
     id: "core.thing",              // stable & unique — never reuse
     title: "Thing",
     subtitle: "optional header note",
     description: "What this shows (shown in the Add widget catalog).",
     defaultSpan: 4,                // 12-col grid
     component: ThingBody,
   };

   export default plugin;
   ```

2. Register it in `src/plugins/index.ts` — import and add to `coreWidgets`.

That's it: it appears in the catalog, and users can add/remove/reorder/resize
it. No changes to `App.tsx`, the grid, or CSS.

## Customization UX

- **Customize** toggles edit mode: dashed frames, per-widget controls
  (◀ ▶ move, width select, ✕ remove, ⠿ drag handle).
- Drag the handle onto another widget to reorder (live preview); ◀ ▶ are the
  keyboard-accessible equivalent.
- **+ Add widget** opens the catalog of registered types; the same type can be
  added multiple times.
- **Reset layout** restores the default arrangement.
- Everything persists to `localStorage` automatically.

## Mock backend

`src/api.ts` returns fake data with simulated latency. Swap for real `fetch`
calls when wiring to the backend.
