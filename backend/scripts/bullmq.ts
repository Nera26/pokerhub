export class Queue {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,class-methods-use-this
  async add(_name: string, _data: unknown, _opts: unknown): Promise<void> {}
}

export class Worker {
  private readonly processor: () => Promise<void> | void;
  constructor(_name: string, processor: () => Promise<void> | void) {
    this.processor = processor;
  }
  async waitUntilReady(): Promise<void> {
    await this.processor();
  }
}
