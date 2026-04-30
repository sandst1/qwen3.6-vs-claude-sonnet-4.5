# Widget Developer Guide

## Overview

The dashboard uses a **pluggable widget system** that makes it easy to add new widget types. Users can customize their dashboard by adding, removing, and reordering widgets.

## Architecture

### Key Components

- **Widget Registry** (`src/widgetRegistry.tsx`) - Central registry of all available widget types
- **Dashboard Config Hook** (`src/hooks/useDashboardConfig.ts`) - Manages user customization and localStorage persistence
- **Widget Wrapper** (`src/components/WidgetWrapper.tsx`) - Adds drag-and-drop and remove controls
- **Customize Panel** (`src/components/CustomizePanel.tsx`) - UI for adding widgets

## Adding a New Widget Type

Follow these simple steps to add a new widget:

### 1. Create Your Widget Component

Create a new component in `src/components/widgets/`. Your widget should:
- Use the standard widget structure (`.widget`, `.widget-header`, `.widget-body` classes)
- Handle its own data fetching
- Manage its own state and refresh intervals

Example:

```tsx
// src/components/widgets/MyNewWidget.tsx
import { useState, useEffect } from "react";
import { fetchMyData } from "../../api";

export function MyNewWidget() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const result = await fetchMyData();
      setData(result);
      setLoading(false);
    };

    loadData();
    const interval = setInterval(loadData, 30_000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="widget">
      <div className="widget-header">
        <span className="widget-title">My New Widget</span>
      </div>
      <div className="widget-body">
        {loading ? (
          <span className="loading">Loading...</span>
        ) : (
          <div>{/* Your widget content */}</div>
        )}
      </div>
    </div>
  );
}
```

### 2. Register Your Widget

Open `src/widgetRegistry.tsx` and:

1. **Import your component**:
   ```tsx
   import { MyNewWidget } from "./components/widgets/MyNewWidget";
   ```

2. **Add to the registry**:
   ```tsx
   export const widgetRegistry: Record<string, WidgetDefinition> = {
     // ... existing widgets ...
     
     myNewWidget: {
       id: "myNewWidget",
       name: "My New Widget",
       description: "Brief description of what this widget shows",
       component: MyNewWidget,
       defaultSpan: 4, // Grid columns to span (1-12)
       category: "metrics", // Category: metrics, alerts, events, status, etc.
     },
   };
   ```

That's it! Your widget is now:
- ✅ Available in the "Add Widget" panel
- ✅ Searchable by category
- ✅ Draggable and removable
- ✅ Respects user customization

### 3. Optional: Add to Default Layout

If you want your widget to appear in the default dashboard layout, add it to `defaultWidgetLayout`:

```tsx
export const defaultWidgetLayout: WidgetInstance[] = [
  // ... existing widgets ...
  { instanceId: "myNewWidget-1", widgetId: "myNewWidget" },
];
```

## Widget Configuration Options

### WidgetDefinition Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Unique identifier (use camelCase) |
| `name` | string | Display name shown in UI |
| `description` | string | Brief description for the add widget panel |
| `component` | ComponentType | Your React component |
| `defaultSpan` | number | Default grid columns (1-12) |
| `category` | string | Category for organization |

### Grid System

The dashboard uses a **12-column CSS Grid**:
- Small widgets: 3-4 columns
- Medium widgets: 5-6 columns  
- Large widgets: 7-12 columns

Widgets automatically wrap to the next row when the 12-column limit is reached.

## Widget Categories

Organize widgets by category for better UX:

- **metrics** - Performance metrics, statistics
- **alerts** - Errors, warnings, critical notifications
- **events** - Activity feeds, logs, recent events
- **status** - Service health, uptime, system status
- **analytics** - Charts, graphs, trends
- **custom** - Other widget types

## User Customization

Users can:
- **Add widgets** - Click "Customize" → "+ Add Widget" → Select from available widgets
- **Remove widgets** - Click "Customize" → Click "×" on any widget
- **Reorder widgets** - Click "Customize" → Drag widgets by the "⋮⋮" handle
- **Reset layout** - Click "Customize" → "+ Add Widget" → "Reset to Default"

All customizations are saved to localStorage and persist across sessions.

## Best Practices

1. **Keep widgets focused** - Each widget should have a single, clear purpose
2. **Handle loading states** - Always show a loading indicator while fetching data
3. **Implement auto-refresh** - Use intervals appropriate for your data source
4. **Use standard styling** - Follow the existing widget structure for consistency
5. **Error handling** - Gracefully handle API failures
6. **Performance** - Don't refresh too frequently; 15-60 seconds is reasonable

## Example: Complete Widget Addition

```tsx
// 1. Create src/components/widgets/CpuUsageWidget.tsx
import { useState, useEffect } from "react";

export function CpuUsageWidget() {
  const [usage, setUsage] = useState(0);
  
  useEffect(() => {
    const fetch = async () => {
      const res = await fetchCpuUsage();
      setUsage(res.percentage);
    };
    fetch();
    const interval = setInterval(fetch, 5000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="widget">
      <div className="widget-header">
        <span className="widget-title">CPU Usage</span>
      </div>
      <div className="widget-body">
        <div style={{ fontSize: '36px', fontWeight: 600 }}>
          {usage}%
        </div>
      </div>
    </div>
  );
}

// 2. Add to src/widgetRegistry.tsx
import { CpuUsageWidget } from "./components/widgets/CpuUsageWidget";

export const widgetRegistry = {
  // ... existing ...
  cpuUsage: {
    id: "cpuUsage",
    name: "CPU Usage",
    description: "Current CPU utilization percentage",
    component: CpuUsageWidget,
    defaultSpan: 3,
    category: "metrics",
  },
};
```

Done! The widget is now available for users to add to their dashboard.

## Support

The pluggable architecture ensures:
- Zero coupling between widgets
- Easy addition of new widget types
- User customization without code changes
- Scalable dashboard that grows with your needs

When product asks for a new widget type, you can deliver it in minutes, not hours.
