export class MatchBundle {
  private readonly data: Record<string, string> = {};

  withEmail(value: string): this {
    this.data.email = value;
    return this;
  }

  withPhone(value: string): this {
    this.data.phone = value;
    return this;
  }

  withName(value: string): this {
    this.data.name = value;
    return this;
  }

  withGclid(value: string): this {
    this.data.gclid = value;
    return this;
  }

  withCustomParam(key: string, value: string): this {
    this.data[key] = value;
    return this;
  }

  toJSON(): Record<string, string> {
    return { ...this.data };
  }
}
