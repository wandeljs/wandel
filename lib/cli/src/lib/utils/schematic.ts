import { LoggerInstance } from './logger';
import { assertIsError } from './error';
import { UnsuccessfulWorkflowExecution, NodeWorkflow } from '@wandel/core';
import { colors } from 'consola/utils';

export async function executeSchematic(
  workflow: NodeWorkflow,
  collection: string,
  schematic: string,
  logger: LoggerInstance,
  options: Record<string, unknown> = {}
): Promise<{ success: boolean; files: Set<string> }> {
  const workflowSubscription = subscribeToWorkflow(workflow, logger);

  // TODO: Allow passing a schematic instance directly
  try {
    await workflow
      .execute({
        collection,
        schematic,
        options,
      })
      .toPromise();

    return {
      success: !workflowSubscription.error,
      files: workflowSubscription.files,
    };
  } catch (e) {
    if (e instanceof UnsuccessfulWorkflowExecution) {
      logger.error(`Migration failed. See above for further details.\n`);
    } else {
      assertIsError(e);
      logger.fatal(`Migration failed: ${e.message}\n`);
    }

    return { success: false, files: workflowSubscription.files };
  } finally {
    workflowSubscription.unsubscribe();
  }
}

export function subscribeToWorkflow(
  workflow: NodeWorkflow,
  logger: LoggerInstance
): {
  files: Set<string>;
  error: boolean;
  unsubscribe: () => void;
} {
  const files = new Set<string>();
  let error = false;
  let logs: string[] = [];

  const reporterSubscription = workflow.reporter.subscribe((event) => {
    // Strip leading slash to prevent confusion.
    const eventPath =
      event.path.charAt(0) === '/' ? event.path.substring(1) : event.path;

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
        logs.push(
          `${colors.cyan('UPDATE')} ${eventPath} (${
            event.content.length
          } bytes)`
        );
        files.add(eventPath);
        break;
      case 'create':
        logs.push(
          `${colors.green('CREATE')} ${eventPath} (${
            event.content.length
          } bytes)`
        );
        files.add(eventPath);
        break;
      case 'delete':
        logs.push(`${colors.yellow('DELETE')} ${eventPath}`);
        files.add(eventPath);
        break;
      case 'rename': {
        const eventToPath =
          event.to.charAt(0) === '/' ? event.to.substring(1) : event.to;
        logs.push(`${colors.blue('RENAME')} ${eventPath} => ${eventToPath}`);
        files.add(eventPath);
        break;
      }
    }
  });

  const lifecycleSubscription = workflow.lifeCycle.subscribe((event) => {
    if (event.kind == 'end' || event.kind == 'post-tasks-start') {
      if (!error) {
        // Output the logging queue, no error happened.
        logs.forEach((log) => logger.info(log));
      }

      logs = [];
      error = false;
    }
  });

  return {
    files,
    error,
    unsubscribe: () => {
      reporterSubscription.unsubscribe();
      lifecycleSubscription.unsubscribe();
    },
  };
}
