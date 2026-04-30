# Example: Adding a New Widget in 2 Minutes

This example demonstrates how quick and easy it is to add a new widget type when product asks for it.

## Scenario

Product manager: "We need a widget showing database query counts!"

## Implementation

### Step 1: Create the Widget Component (90 seconds)

Create `src/components/widgets/QueryCountWidget.tsx`:

```tsx
import { useState, useEffect } from "react";

export function QueryCountWidget() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      setCount(Math.floor(Math.random() * 10000));
      setLoading(false);
    };

    loadData();
    const interval = setInterval(loadData, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="widget">
      <div className="widget-header">
        <span className="widget-title">DB Query Count</span>
        <span className="widget-subtitle">Last 1 hour</span>
      </div>
      <div className="widget-body">
        {loading ? (
          <span className="loading">Loading...</span>
        ) : (
          <div style={{ fontSize: '36px', fontWeight: 600 }}>
            {count.toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}
```

### Step 2: Register in Widget Registry (30 seconds)

Edit `src/widgetRegistry.tsx`:

```tsx
// 1. Add import at the top
import { QueryCountWidget } from "./components/widgets/QueryCountWidget";

// 2. Add to registry object
export const widgetRegistry: Record<string, WidgetDefinition> = {
  // ... existing widgets ...
  
  queryCount: {
    id: "queryCount",
    name: "DB Query Count",
    description: "Database query count for the last hour",
    component: QueryCountWidget,
    defaultSpan: 3,
    category: "metrics",
  },
};
```

### Done! ✨

Total time: **~2 minutes**

The widget is now:
- Available in the customization panel
- Fully functional with auto-refresh
- Draggable and removable
- Categorized under "metrics"
- Ready for users to add to their dashboard

## What Users See

1. Click "Customize"
2. Click "+ Add Widget"
3. See "DB Query Count" in the metrics category
4. Click "Add"
5. Widget appears on their dashboard

## What You Get

- **Zero coupling** - Widget is completely independent
- **Hot reload** - Changes appear instantly in dev mode
- **Type safety** - Full TypeScript support
- **Consistent UX** - Automatic controls and styling
- **User control** - They decide if they want it

## The Power of Pluggable Architecture

Before (hardcoded):
```tsx
// App.tsx - Every new widget requires editing this file
<div className="dashboard-grid">
  <StatsWidget />
  <LatencyWidget />
  <ErrorsWidget />
  <ActivityWidget />
  <ServicesWidget />
  {/* Product wants a new one? Edit main app component! */}
</div>
```

After (pluggable):
```tsx
// widgetRegistry.tsx - Just add to registry
export const widgetRegistry = {
  stats: { ... },
  latency: { ... },
  errors: { ... },
  activity: { ... },
  services: { ... },
  queryCount: { ... }, // ← Just add this entry!
};
```

## Real-World Benefits

1. **Product velocity** - Ship new widgets in minutes
2. **User empowerment** - Let users choose what they need
3. **Clean codebase** - No widget-specific logic in main app
4. **Easy testing** - Test widgets in isolation
5. **Scalability** - Support 10 widgets or 100 widgets

When product asks for the 20th widget, it's just as easy as the first.
