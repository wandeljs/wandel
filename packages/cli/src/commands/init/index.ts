import { defineCommand } from 'citty';
import { sharedArgs } from '../_shared';
import { NodeWorkflow } from '@wandeljs/core';
import { getPackageManager } from '../../utils/packageManagers';
import { join, resolve } from 'pathe';
import { UnsuccessfulWorkflowExecution } from '@angular-devkit/schematics';
import { colors } from 'consola/utils';
import { createConsolaLogger } from '../../utils/logger';
import { log } from '@clack/prompts';

export default defineCommand({
  meta: {
    name: 'init',
    description: 'create a blank schematic folder',
  },
  args: {
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
    const { force, dryRun, verbose } = ctx.args;
    const cwd = resolve(ctx.args.cwd || '.');
    const packageManager = getPackageManager(cwd) ?? undefined;

    const workflow = new NodeWorkflow(process.cwd(), {
      force,
      dryRun,
      resolvePaths: [cwd, __dirname],
      schemaValidation: true,
      packageManager: packageManager,
    });

    const INIT_SCHEMATIC = join(__dirname, 'collection.json');
    const logger = createConsolaLogger(ctx.args.verbose);
    let error = false;
    let loggingQueue: string[] = [];

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
    logger.info('args: ' + JSON.stringify(ctx.args));
    ctx.rawArgs.forEach((e) => logger.info('raw arg' + JSON.stringify(e)));

    try {
      await workflow
        .execute({
          collection: INIT_SCHEMATIC,
          schematic: 'init',
          options: ctx.args,
          allowPrivate: false,
          debug: verbose,
          logger: logger, // TODO Figure out something about the logger
        })
        .toPromise();
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
