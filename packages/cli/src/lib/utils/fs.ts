import { dirname } from 'pathe';

export function findup<T>(
  rootDir: string,
  fn: (dir: string) => T | undefined
): T | null {
  let dir = rootDir;
  while (dir !== dirname(dir)) {
    const res = fn(dir);
    if (res) {
      return res;
    }
    dir = dirname(dir);
  }
  return null;
}
