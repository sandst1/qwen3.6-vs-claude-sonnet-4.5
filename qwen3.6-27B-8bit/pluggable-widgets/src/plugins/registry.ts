import type { WidgetDescriptor } from "./widget-types";

class WidgetRegistry {
  #widgets = new Map<string, WidgetDescriptor<unknown>>();

  /** Register a widget type. Returns self for chaining. */
  add<T>(descriptor: WidgetDescriptor<T>): this {
    if (this.#widgets.has(descriptor.id)) {
      console.warn(
        `[WidgetRegistry] Widget "${descriptor.id}" already registered, overwriting.`
      );
    }
    this.#widgets.set(descriptor.id, descriptor as WidgetDescriptor<unknown>);
    return this;
  }

  /** Remove a widget type from the registry. */
  remove(id: string): boolean {
    return this.#widgets.delete(id);
  }

  /** Look up a single widget descriptor by ID. */
  get<T = unknown>(id: string): WidgetDescriptor<T> | undefined {
    return this.#widgets.get(id) as WidgetDescriptor<T> | undefined;
  }

  /** Return all registered widget descriptors. */
  getAll(): WidgetDescriptor[] {
    return Array.from(this.#widgets.values());
  }

  /** Check whether a widget type is registered. */
  has(id: string): boolean {
    return this.#widgets.has(id);
  }
}

export const registry = new WidgetRegistry();
