export interface UpdateSchema {
  packages: string[];
  force: boolean;
  next: boolean;
  migrateOnly: boolean;
  from: string | undefined;
  to: string | undefined;
  registry: string;
  verbose: boolean;
  packageManager: 'npm' | 'yarn' | 'cnpm' | 'pnpm' | 'bun';
}
