import type { WidgetType } from "./widget-schema";

export class WidgetRegistry {
  private widgets = new Map<string, WidgetType>();

  register(widgetType: WidgetType): void {
    this.widgets.set(widgetType.id, widgetType);
  }

  get(id: string): WidgetType | undefined {
    return this.widgets.get(id);
  }

  getAll(): WidgetType[] {
    return Array.from(this.widgets.values());
  }

  has(id: string): boolean {
    return this.widgets.has(id);
  }
}

export const registry = new WidgetRegistry();
