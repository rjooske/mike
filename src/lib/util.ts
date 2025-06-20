export function assert(b: boolean): asserts b {
  if (!b) {
    throw new Error("assertion failed");
  }
}

export function unreachable(_: never): never {
  throw new Error("should be unreachable");
}

export function parseNumber(s: string): number | undefined {
  const x = parseFloat(s);
  if (isNaN(x)) {
    return undefined;
  }
  return x;
}
