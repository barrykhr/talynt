/** Minimal class joiner — keeps component markup readable without a dependency. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** Deterministic pseudo-random in [0,1) so server and client render identically. */
export function seeded(index: number, salt = 1): number {
  const x = Math.sin((index + 1) * 127.1 * salt) * 43758.5453;
  return x - Math.floor(x);
}
