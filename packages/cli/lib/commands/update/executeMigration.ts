import semver from "semver/preload";
import {
	SchematicDescription,
	FileSystemCollectionDescription,
	FileSystemSchematicDescription,
	NodeWorkflow,
} from "@wandel/core";
import { askChoices } from "../../utils/console";
import { executeSchematic } from "../../utils/schematic";
import { Logger } from "../../utils/logger";

interface MigrationSchematicDescription
	extends SchematicDescription<
		FileSystemCollectionDescription,
		FileSystemSchematicDescription
	> {
	version?: string;
	optional?: boolean;
}

interface MigrationSchematicDescriptionWithVersion
	extends MigrationSchematicDescription {
	version: string;
}

export async function executeMigrations(
	workflow: NodeWorkflow,
	packageName: string,
	collectionPath: string,
	from: string,
	to: string,
	commit?: boolean,
): Promise<number> {
	const collection = workflow.engine.createCollection(collectionPath);
	const migrationRange = new semver.Range(
		">" +
			(semver.prerelease(from) ? from.split("-")[0] + "-0" : from) +
			" <=" +
			to.split("-")[0],
	);

	const requiredMigrations: MigrationSchematicDescriptionWithVersion[] = [];
	const optionalMigrations: MigrationSchematicDescriptionWithVersion[] = [];

	for (const name of collection.listSchematicNames()) {
		const schematic = workflow.engine.createSchematic(name, collection);
		const description = schematic.description as MigrationSchematicDescription;

		description.version = coerceVersionNumber(description.version);
		if (!description.version) {
			continue;
		}

		if (
			semver.satisfies(description.version, migrationRange, {
				includePrerelease: true,
			})
		) {
			(description.optional ? optionalMigrations : requiredMigrations).push(
				description as MigrationSchematicDescriptionWithVersion,
			);
		}
	}

	if (requiredMigrations.length === 0 && optionalMigrations.length === 0) {
		return 0;
	}

	// Required migrations
	if (requiredMigrations.length) {
		// this.context.logger.info(
		// 	colors.cyan(`** Executing migrations of package '${packageName}' **\n`),
		// );

		requiredMigrations.sort(
			(a, b) =>
				semver.compare(a.version, b.version) || a.name.localeCompare(b.name),
		);

		const result = await executePackageMigrations(
			workflow,
			requiredMigrations,
			packageName,
			commit,
		);

		if (result === 1) {
			return 1;
		}
	}

	// Optional migrations
	if (optionalMigrations.length) {
		// this.context.logger.info(
		// 	colors.magenta(`** Optional migrations of package '${packageName}' **\n`),
		// );

		optionalMigrations.sort(
			(a, b) =>
				semver.compare(a.version, b.version) || a.name.localeCompare(b.name),
		);

		const migrationsToRun = await getOptionalMigrationsToRun(
			optionalMigrations,
			packageName,
		);

		if (migrationsToRun?.length) {
			return executePackageMigrations(
				workflow,
				migrationsToRun,
				packageName,
				commit,
			);
		}
	}

	return 0;
}

async function executePackageMigrations(
	workflow: NodeWorkflow,
	migrations: MigrationSchematicDescription[],
	packageName: string,
	commit = false,
): Promise<1 | 0> {
	// const { logger } = this.context; TODO refactor logger to singleton
	for (const migration of migrations) {
		// const { title, description } = getMigrationTitleAndDescription(migration);

		// logger.info(colors.cyan(colors.symbols.pointer) + " " + colors.bold(title));

		// if (description) {
		// 	logger.info("  " + description);
		// }

		const { success } = await executeSchematic(
			workflow,
			migration.collection.name,
			migration.name,
			Logger.getInstance(),
		);
		if (!success) {
			return 1;
		}

		// let modifiedFilesText: string;
		// switch (files.size) {
		// 	case 0:
		// 		modifiedFilesText = "No changes made";
		// 		break;
		// 	case 1:
		// 		modifiedFilesText = "1 file modified";
		// 		break;
		// 	default:
		// 		modifiedFilesText = `${files.size} files modified`;
		// 		break;
		// }

		// logger.info(`  Migration completed (${modifiedFilesText}).`);

		// Commit migration
		// TODO Implement Commit Logic
		// if (commit) {
		// 	const commitPrefix = `${packageName} migration - ${migration.name}`;
		// 	const commitMessage = migration.description
		// 		? `${commitPrefix}\n\n${migration.description}`
		// 		: commitPrefix;
		// 	const committed = this.commit(commitMessage);
		// 	if (!committed) {
		// 		// Failed to commit, something went wrong. Abort the update.
		// 		return 1;
		// 	}
		// }

		// logger.info(""); // Extra trailing newline.
	}

	return 0;
}

function coerceVersionNumber(version: string | undefined): string | undefined {
	if (!version) {
		return undefined;
	}

	if (!/^\d{1,30}\.\d{1,30}\.\d{1,30}/.test(version)) {
		const match = version.match(/^\d{1,30}(\.\d{1,30})*/);

		if (!match) {
			return undefined;
		}

		if (!match[1]) {
			version =
				version.substring(0, match[0].length) +
				".0.0" +
				version.substring(match[0].length);
		} else if (!match[2]) {
			version =
				version.substring(0, match[0].length) +
				".0" +
				version.substring(match[0].length);
		} else {
			return undefined;
		}
	}

	return semver.valid(version) ?? undefined;
}

async function getOptionalMigrationsToRun(
	optionalMigrations: MigrationSchematicDescription[],
	packageName: string,
): Promise<MigrationSchematicDescription[] | undefined> {
	// const { logger } = this.context; // TODO REFACTOR TO LOGGER SINGLETON
	// const numberOfMigrations = optionalMigrations.length;
	// logger.info(
	// 	`This package has ${numberOfMigrations} optional migration${
	// 		numberOfMigrations > 1 ? "s" : ""
	// 	} that can be executed.`,
	// );
	// logger.info(""); // Extra trailing newline.

	const answer = await askChoices(
		`Select the migrations that you'd like to run`,
		optionalMigrations.map((migration) => {
			const { title } = getMigrationTitleAndDescription(migration);

			return {
				label: title,
				value: migration.name,
			};
		}),
	);

	// logger.info(""); // Extra trailing newline.

	return optionalMigrations.filter(({ name }) => answer.value?.includes(name));
}

function getMigrationTitleAndDescription(
	migration: MigrationSchematicDescription,
): {
	title: string;
	description: string;
} {
	const [title, ...description] = migration.description.split(". ");

	return {
		title: title.endsWith(".") ? title : title + ".",
		description: description.join(".\n  "),
	};
}
