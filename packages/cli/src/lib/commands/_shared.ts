export const sharedArgs = {
  cwd: {
    type: 'string',
    description: 'Current working directory',
  },
  verbose: {
    type: 'boolean',
    description: 'Log more verbose information for troubleshooting',
  },
} as const;

export interface SharedArgs {
  cwd?: string;
  verbose: boolean;
}
