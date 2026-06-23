import type { WidgetDefinition, WidgetId } from "./types";

class WidgetRegistry {
  private widgets = new Map<WidgetId, WidgetDefinition>();

  register(widget: WidgetDefinition) {
    if (this.widgets.has(widget.id)) {
      throw new Error(`Widget "${widget.id}" is already registered`);
    }
    this.widgets.set(widget.id, widget);
  }

  get(id: WidgetId): WidgetDefinition | undefined {
    return this.widgets.get(id);
  }

  getAll(): WidgetDefinition[] {
    return Array.from(this.widgets.values());
  }

  get ids(): WidgetId[] {
    return Array.from(this.widgets.keys());
  }

  has(id: WidgetId): boolean {
    return this.widgets.has(id);
  }
}

export const registry = new WidgetRegistry();
