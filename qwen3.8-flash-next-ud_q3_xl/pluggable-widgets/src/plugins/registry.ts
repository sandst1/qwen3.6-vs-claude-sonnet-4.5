import type { WidgetPlugin } from "./types";

/**
 * Central widget-type registry. Widgets are registered at startup (see
 * src/plugins/index.ts); third-party widget packages would call
 * `registry.register()` from their entry module.
 */
export class WidgetRegistry {
  private plugins = new Map<string, WidgetPlugin>();

  register(plugin: WidgetPlugin): void {
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Widget type "${plugin.id}" is already registered`);
    }
    this.plugins.set(plugin.id, plugin);
  }

  get(id: string): WidgetPlugin | undefined {
    return this.plugins.get(id);
  }

  /** Registered plugins, in registration order. */
  list(): WidgetPlugin[] {
    return [...this.plugins.values()];
  }
}

export const registry = new WidgetRegistry();
