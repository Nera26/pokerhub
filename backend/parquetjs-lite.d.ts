declare module 'parquetjs-lite' {
  type ParquetPrimitiveType =
    | 'BOOLEAN'
    | 'INT32'
    | 'INT64'
    | 'DOUBLE'
    | 'UTF8';

  interface ParquetField {
    type: ParquetPrimitiveType;
    optional?: boolean;
    repeated?: boolean;
  }

  export class ParquetSchema {
    constructor(schema: Record<string, ParquetField>);
    fields: Record<string, ParquetField>;
  }

  export class ParquetWriter<T extends Record<string, unknown> = Record<string, unknown>> {
    static openStream(
      schema: ParquetSchema,
      stream: NodeJS.WritableStream,
    ): Promise<ParquetWriter>;

    appendRow(row: T): Promise<void>;
    close(): Promise<void>;
  }
}
