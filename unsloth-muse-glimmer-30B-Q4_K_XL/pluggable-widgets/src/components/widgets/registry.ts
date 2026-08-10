import React from "react";

export type WidgetMetadata = {
  id: string;
  title: string;
  defaultWidth: number;
  component: React.ComponentType<any>;
};

class WidgetRegistry {
  private widgets = new Map<string, WidgetMetadata>();

  register(meta: WidgetMetadata) {
    this.widgets.set(meta.id, meta);
  }

  get(id: string) {
    return this.widgets.get(id);
  }

  getAll(): WidgetMetadata[] {
    return Array.from(this.widgets.values());
  }

  has(id: string) {
    return this.widgets.has(id);
  }
}

export const widgetRegistry = new WidgetRegistry();
