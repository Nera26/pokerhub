declare module 'js-sha256' {
  type Message =
    | string
    | ArrayBuffer
    | Uint8Array
    | Int8Array
    | Uint8ClampedArray
    | Int16Array
    | Uint16Array
    | Int32Array
    | Uint32Array
    | Float32Array
    | Float64Array
    | number[]
    | Buffer;

  interface Hasher {
    update(message: Message): Hasher;
    hex(): string;
    array(): number[];
    arrayBuffer(): ArrayBuffer;
    digest(): number[];
  }

  interface Sha256 {
    (message: Message): string;
    create(): Hasher;
    update(message: Message): Hasher;
    hex(message: Message): string;
    array(message: Message): number[];
    arrayBuffer(message: Message): ArrayBuffer;
    digest(message: Message): number[];
  }

  export const sha256: Sha256;
  export default sha256;
}
