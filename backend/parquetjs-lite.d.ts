declare module 'parquetjs-lite' {
  import type { Writable } from 'stream';

  export class ParquetSchema {
    constructor(schema: Record<string, unknown>);
  }

  export class ParquetWriter<TSchema = Record<string, unknown>> {
    static openStream<T = Record<string, unknown>>(
      schema: ParquetSchema,
      stream: Writable,
    ): Promise<ParquetWriter<T>>;

    appendRow(row: TSchema): Promise<void>;

    close(): Promise<void>;
  }
}
