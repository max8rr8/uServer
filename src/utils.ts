export type ResponseType = Buffer | Uint8Array | Uint16Array | Uint32Array | number[] | string;

export function toRecognizeableString(chunk: ResponseType) {
  if (typeof chunk === 'string') return chunk;
  if (ArrayBuffer.isView(chunk)) return chunk;
  if (typeof chunk[Symbol.iterator] === 'function') return new Uint8Array(chunk);
  return '';
}