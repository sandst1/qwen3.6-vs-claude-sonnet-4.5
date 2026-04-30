export interface WidgetDef {
  key: string;
  title: string;
  subtitle: string;
  span: number;
  component: React.ComponentType;
}

export type ChangeListener = () => void;

export class WidgetRegistry {
  private widgets = new Map<string, WidgetDef>();
  private order: string[] = [];
  private listeners = new Set<ChangeListener>();

  register(def: WidgetDef): void {
    this.widgets.set(def.key, def);
    if (!this.order.includes(def.key)) {
      this.order.push(def.key);
    }
    this.notify();
  }

  unregister(key: string): void {
    this.widgets.delete(key);
    this.order = this.order.filter((k) => k !== key);
    this.notify();
  }

  get(key: string): WidgetDef | undefined {
    return this.widgets.get(key);
  }

  getAll(): WidgetDef[] {
    return this.order
      .filter((key) => this.widgets.has(key))
      .map((key) => this.widgets.get(key)!)
      .filter((def): def is WidgetDef => def != null);
  }

  getOrder(): string[] {
    return [...this.order];
  }

  setOrder(keys: string[]): void {
    this.order = keys;
    this.notify();
  }

  has(key: string): boolean {
    return this.widgets.has(key);
  }

  onChange(listener: ChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
