import { defineCommand } from 'citty';
import { sharedArgs } from '../_shared';
import { resolve } from 'pathe';
import { getPackageManager } from '../../utils/packageManagers';
import { Logger } from '../../utils/logger';
import { NodeWorkflow } from '@wandeljs/core';

export default defineCommand({
  meta: {
    name: 'run',
    description: 'execute a schematic',
  },
  args: {
    schematicName: {
      type: 'positional',
      description: '[CollectionName:]SchematicName ',
    },
    force: {
      type: 'boolean',
      description: 'Force overwriting existing files',
    },
    dryRun: {
      type: 'boolean',
      description: 'Perform a dry run without making any changes',
    },
    ...sharedArgs,
  },
  async run(ctx) {
    // TODO passthrough args
    const { force, dryRun, verbose } = ctx.args;
    const { collection, schematic } = parseSchematicName(
      ctx.args.schematicName
    );
    const cwd = resolve(ctx.args.cwd || '.');
    const packageManager = getPackageManager(cwd) ?? undefined;
    const logger = Logger.getInstance(verbose);

    if (!schematic) {
      throw new Error('Schematic Name is required argument');
    }

    const workflow = new NodeWorkflow(process.cwd(), {
      force,
      dryRun,
      resolvePaths: [cwd, __dirname],
      schemaValidation: true,
      packageManager: packageManager,
    });

    return workflow.execute({
      collection: collection,
      schematic: schematic,
      options: {},
      allowPrivate: false,
      debug: verbose,
      logger: undefined,
    });
  },
});

function parseSchematicName(str: string | null): {
  collection: string;
  schematic: string | null;
} {
  let collection = '@angular-devkit/schematics-cli';

  let schematic = str;
  if (schematic?.includes(':')) {
    const lastIndexOfColon = schematic.lastIndexOf(':');
    [collection, schematic] = [
      schematic.slice(0, lastIndexOfColon),
      schematic.substring(lastIndexOfColon + 1),
    ];
  }

  return { collection, schematic };
}
