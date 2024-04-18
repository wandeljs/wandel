import { defineCommand } from 'citty';
import { sharedArgs } from '../_shared';
import { resolve } from 'pathe';
import { getPackageManager } from '../../utils/packageManagers';
import { createConsolaLogger, Logger } from '../../utils/logger';
import { NodeWorkflow } from '@wandeljs/core';
import { colors } from 'consola/utils';
import { UnsuccessfulWorkflowExecution } from '@angular-devkit/schematics';

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

    if (!schematic) {
      throw new Error('Schematic Name is required argument');
    }

    const logger = createConsolaLogger(ctx.args.verbose);
    let error = false;
    let loggingQueue: string[] = [];

    const workflow = new NodeWorkflow(process.cwd(), {
      force,
      dryRun,
      resolvePaths: [cwd, __dirname],
      schemaValidation: true,
      packageManager: packageManager,
    });

    /**
     * Logs out dry run events.
     *
     * All events will always be executed here, in order of discovery. That means that an error would
     * be shown along other events when it happens. Since errors in workflows will stop the Observable
     * from completing successfully, we record any events other than errors, then on completion we
     * show them.
     *
     * This is a simple way to only show errors when an error occur.
     */
    workflow.reporter.subscribe((event) => {
      // Strip leading slash to prevent confusion.
      const eventPath = event.path.startsWith('/')
        ? event.path.slice(1)
        : event.path;

      switch (event.kind) {
        case 'error': {
          error = true;

          const desc =
            event.description == 'alreadyExist'
              ? 'already exists'
              : 'does not exist';
          logger.error(`ERROR! ${eventPath} ${desc}.`);
          break;
        }
        case 'update':
          loggingQueue.push(
            `${colors.cyan('UPDATE')} ${eventPath} (${
              event.content.length
            } bytes)`
          );
          break;
        case 'create':
          loggingQueue.push(
            `${colors.green('CREATE')} ${eventPath} (${
              event.content.length
            } bytes)`
          );
          break;
        case 'delete':
          loggingQueue.push(`${colors.yellow('DELETE')} ${eventPath}`);
          break;
        case 'rename': {
          const eventToPath = event.to.startsWith('/')
            ? event.to.slice(1)
            : event.to;
          loggingQueue.push(
            `${colors.blue('RENAME')} ${eventPath} => ${eventToPath}`
          );
          break;
        }
      }
    });

    /**
     * Listen to lifecycle events of the workflow to flush the logs between each phases.
     */
    workflow.lifeCycle.subscribe((event) => {
      if (event.kind == 'workflow-end' || event.kind == 'post-tasks-start') {
        if (!error) {
          // Flush the log queue and clean the error state.
          loggingQueue.forEach((log) => logger.info(log));
        }

        loggingQueue = [];
        error = false;
      }
    });

    // Show usage of deprecated options
    workflow.registry.useXDeprecatedProvider((msg) => logger.warn(msg));

    try {
      workflow.execute({
        collection: collection,
        schematic: schematic,
        options: {},
        allowPrivate: false,
        debug: verbose,
        logger: undefined,
      });
      logger.info('SUCCESS!!!!!');
      return 0;
    } catch (err) {
      if (err instanceof UnsuccessfulWorkflowExecution) {
        // "See above" because we already printed the error.
        logger.fatal('The Schematic workflow failed. See above.');
        return 1;
      } else {
        logger.fatal(`Error: ${err instanceof Error ? err.message : err}`);
        return 1;
      }
    }
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
