export class Queue {
  async add(): Promise<void> {}
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
