import { defineCommand } from "citty";
import { sharedArgs } from "../_shared";
import { NodeWorkflow } from "@wandel/core";
import { getPackageManager } from "../../utils/packageManagers";
import { join, resolve } from "pathe";
import { Logger } from "../../utils/logger";

export default defineCommand({
	meta: {
		name: "init",
		description: "create a blank schematic folder",
	},
	args: {
		force: {
			type: "boolean",
			description: "Force overwriting existing files",
		},
		dryRun: {
			type: "boolean",
			description: "Perform a dry run without making any changes",
		},

		...sharedArgs,
	},
	async run(ctx) {
		const { force, dryRun, verbose } = ctx.args;
		const cwd = resolve(ctx.args.cwd || ".");
		const packageManager = getPackageManager(cwd) ?? undefined;
		const logger = Logger.getInstance(verbose);

		const workflow = new NodeWorkflow(process.cwd(), {
			force,
			dryRun,
			resolvePaths: [cwd, __dirname],
			schemaValidation: true,
			packageManager: packageManager,
		});

		const INIT_SCHEMATIC = join(__dirname, "collection.json");

		return workflow.execute({
			collection: INIT_SCHEMATIC,
			schematic: "init",
			options: {},
			allowPrivate: false,
			debug: verbose,
			logger: logger as any, // TODO Figure out something about the logger
		});
	},
});
