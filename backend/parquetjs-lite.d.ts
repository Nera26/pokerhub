declare module 'parquetjs-lite' {
  import type { Writable } from 'stream';

  export type ParquetPrimitiveType =
    | 'BOOLEAN'
    | 'INT32'
    | 'INT64'
    | 'DOUBLE'
    | 'UTF8';

  export interface ParquetField {
    type: ParquetPrimitiveType;
    optional?: boolean;
    repeated?: boolean;
  }

  export class ParquetSchema {
    constructor(schema: Record<string, ParquetField>);
    fields: Record<string, ParquetField>;
  }

  export class ParquetWriter<T extends Record<string, unknown> = Record<string, unknown>> {
    static openStream<TSchema extends Record<string, unknown> = Record<string, unknown>>(
      schema: ParquetSchema,
      stream: Writable,
    ): Promise<ParquetWriter<TSchema>>;

    appendRow(row: T): Promise<void>;
    close(): Promise<void>;
  }
}
