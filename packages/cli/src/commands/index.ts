import type { CommandDef } from 'citty';

const _rDefault = (r: unknown) => {
  return ((r as { default: Promise<CommandDef> }).default ||
    r) as Promise<CommandDef>;
};

export const commands = {
  update: () => import('./update').then(_rDefault),
  init: () => import('./init').then(_rDefault),
  run: () => import('./run').then(_rDefault),
} as const;
