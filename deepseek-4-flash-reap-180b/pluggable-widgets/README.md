# ops-dashboard

Internal ops dashboard with a pluggable widget system. Users can add, remove,
and reorder widgets. Layout is persisted to localStorage.

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

## Architecture

```
src/
  registry.ts        — WidgetDefinition type + global registry (defineWidget, getWidget, getAllWidgets)
  DashboardContext.tsx — React context managing the active widget list + add/remove/move actions + localStorage persistence
  widgets.tsx        — Registers all built-in widgets by calling defineWidget()
  components/
    WidgetFrame.tsx  — Wrapper chrome (title bar, ▲/▼/� button) rendered around every widget
  App.tsx            — DashboardProvider → DashboardInner → grid layout + "Add Widget" picker
```

### Adding a new widget

Create a widget definition in any `.tsx` file and register it:

```ts
import { defineWidget } from "./registry";

defineWidget({
  id: "my-widget",
  title: "My Widget",
  subtitle: "optional subtitle",
  defaultCols: 4,           // how many of the 12 grid columns it occupies
  component() {
    // Return JSX — fetch your own data, render whatever you like
    return <div>Hello</div>;
  },
});
```

The definition must be imported somewhere in the module graph so that
`defineWidget()` runs at boot. The simplest place is `src/widgets.tsx`.

That's it — the widget appears in the "Add Widget" dropdown automatically.

### Built-in widgets

| ID           | Title           | Cols | Description            |
| ------------ | --------------- | ---- | ---------------------- |
| stats        | Summary         | 3    | Key ops metrics        |
| latency      | Request Latency | 6    | P95/P99 line chart     |
| errors       | Errors          | 3    | Error count + alert    |
| activity     | Recent Activity | 7    | Event feed             |
| services     | Services        | 5    | Service status grid    |

### Mock backend

`src/api.ts` returns fake data with simulated latency. Swap for real `fetch`
calls when wiring to the backend.
