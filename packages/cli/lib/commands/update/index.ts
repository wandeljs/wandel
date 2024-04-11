import { defineCommand } from "citty";
import { dirname, join, resolve } from "pathe";
import { sharedArgs } from "../_shared";
import { getPackageManager, PackageManager } from "../../utils/packageManagers";
import {
	fetchPackageMetadata,
	getProjectDependencies,
	PackageIdentifier,
	PackageManifest,
	PackageTreeNode,
	parsePackages,
} from "./packages";
import {
	NodeModulesEngineHost,
	NodeWorkflow,
	NodeWorkflowOptions,
} from "@angular-devkit/schematics/tools";
import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { Logger, LoggerInstance } from "../../utils/logger";
import pickManifest from "npm-pick-manifest";
import { assertIsError } from "../../utils/error";
import { executeSchematic } from "../../utils/schematic";
import { installDependencies } from "nypm";
import { executeMigrations } from "./executeMigration";

export default defineCommand({
	meta: {
		name: "update",
		description: "Update Dependencies and run migrations if possible",
	},
	args: {
		packages: {
			type: "string",
			description: "The names of package(s) to update",
			required: true,
		},
		"create-commits": {
			type: "boolean",
			description: "Create source control commits for updates and migrations",
			default: false,
		},
		...sharedArgs,
	},
	async run(ctx) {
		const cwd = resolve(ctx.args.cwd || ".");
		const packageManager = getPackageManager(cwd);
		const logger = Logger.getInstance(ctx.args.verbose);
		if (!packageManager) {
			throw new Error("Package Manager is required!");
		}
		const packages = parsePackages(ctx.args.packages);

		const workflow = new NodeWorkflow(cwd, {
			packageManager: packageManager,
			packageManagerForce: false,
			resolvePaths: [__dirname, cwd],
			schemaValidation: true,
			engineHostCreator: (options: NodeWorkflowOptions) =>
				new NodeModulesEngineHost(options.resolvePaths),
		});

		const rootDependencies = await getProjectDependencies(cwd);
		await updatePackagesAndMigrate(
			workflow,
			rootDependencies,
			ctx.args,
			packages,
			cwd,
			packageManager,
			logger,
		);
	},
});

export async function updatePackagesAndMigrate(
	workflow: NodeWorkflow,
	rootDependencies: Map<string, PackageTreeNode>,
	options: { verbose: boolean; "create-commits": boolean },
	packages: PackageIdentifier[],
	cwd: string,
	packageManager: PackageManager,
	logger: LoggerInstance,
): Promise<number> {
	const requests: {
		identifier: PackageIdentifier;
		node: PackageTreeNode;
	}[] = [];

	// Validate packages actually are part of the workspace
	for (const pkg of packages) {
		const node = rootDependencies.get(pkg.name);
		if (!node?.package) {
			logger.error(`Package '${pkg.name}' is not a dependency.`);

			return 1;
		}

		// If a specific version is requested and matches the installed version, skip.
		if (pkg.type === "version" && node.package.version === pkg.fetchSpec) {
			logger.info(`Package '${pkg.name}' is already at '${pkg.fetchSpec}'.`);
			continue;
		}

		requests.push({ identifier: pkg, node });
	}

	if (requests.length === 0) {
		return 0;
	}

	logger.info("Fetching dependency metadata from registry...");

	const packagesToUpdate: string[] = [];
	for (const { identifier: requestIdentifier, node } of requests) {
		const packageName = requestIdentifier.name;

		let metadata;
		try {
			// Metadata requests are internally cached; multiple requests for same name
			// does not result in additional network traffic
			metadata = await fetchPackageMetadata(packageName, logger);
		} catch (e) {
			assertIsError(e);
			logger.error(
				`Error fetching metadata for '${packageName}': ` + e.message,
			);
			return 1;
		}

		// Try to find a package version based on the user requested package specifier
		// registry specifier types are either version, range, or tag
		let manifest: PackageManifest | undefined;
		if (
			requestIdentifier.type === "version" ||
			requestIdentifier.type === "range" ||
			requestIdentifier.type === "tag"
		) {
			try {
				manifest = pickManifest(metadata, requestIdentifier.fetchSpec);
			} catch (e) {
				assertIsError(e);
				if (e.code === "ETARGET") {
					// If not found and next was used and user did not provide a specifier, try latest.
					// Package may not have a next tag.
					if (
						requestIdentifier.type === "tag" &&
						requestIdentifier.fetchSpec === "next" &&
						!requestIdentifier.rawSpec
					) {
						try {
							manifest = pickManifest(metadata, "latest");
						} catch (e) {
							assertIsError(e);
							if (e.code !== "ETARGET" && e.code !== "ENOVERSIONS") {
								throw e;
							}
						}
					}
				} else if (e.code !== "ENOVERSIONS") {
					throw e;
				}
			}
		}

		if (!manifest) {
			logger.error(
				`Package specified by '${requestIdentifier.raw}' does not exist within the registry.`,
			);
			return 1;
		}

		if (manifest.version === node.package?.version) {
			logger.info(`Package '${packageName}' is already up to date.`);
			continue;
		}

		packagesToUpdate.push(requestIdentifier.toString());
	}

	if (packagesToUpdate.length === 0) {
		return 0;
	}

	const UPDATE_SCHEMATIC_COLLECTION = join(
		__dirname,
		"schematic/collection.json",
	);

	const { success } = await executeSchematic(
		workflow,
		UPDATE_SCHEMATIC_COLLECTION,
		"update",
		logger,
		{
			packageManager: packageManager,
			packages: packagesToUpdate,
			debug: options.verbose,
		},
	);

	if (success) {
		try {
			await rm(join(cwd, "node_modules"), {
				force: true,
				recursive: true,
				maxRetries: 3,
			});
		} catch {}

		const installationSuccess = await installDependencies({
			cwd,
			silent: true,
			packageManager,
		})
			.then(() => true)
			.catch(() => false);

		if (!installationSuccess) {
			throw new Error("Failed to install dependencies");
		}
	}

	// if (success && options["create-commits"]) {
	// 	if (
	// 		!gitCommit(
	// 			`Angular CLI update for packages - ${packagesToUpdate.join(", ")}`,
	// 		)
	// 	) {
	// 		return 1;
	// 	}
	// }

	// This is a temporary workaround to allow data to be passed back from the update schematic
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const migrations = (global as any).externalMigrations as {
		package: string;
		collection: string;
		from: string;
		to: string;
	}[];

	if (success && migrations) {
		const rootRequire = createRequire(cwd + "/");
		for (const migration of migrations) {
			// Resolve the package from the workspace root, as otherwise it will be resolved from the temp
			// installed CLI version.
			let packagePath;
			logger.verbose(
				`Resolving migration package '${migration.package}' from '${cwd}'...`,
			);
			try {
				try {
					packagePath = dirname(
						// This may fail if the `package.json` is not exported as an entry point
						rootRequire.resolve(join(migration.package, "package.json")),
					);
				} catch (e) {
					assertIsError(e);
					if (e.code === "MODULE_NOT_FOUND") {
						// Fallback to trying to resolve the package's main entry point
						packagePath = rootRequire.resolve(migration.package);
					} else {
						throw e;
					}
				}
			} catch (e) {
				assertIsError(e);
				if (e.code === "MODULE_NOT_FOUND") {
					logger.verbose(e.toString());
					logger.error(
						`Migrations for package (${migration.package}) were not found.` +
							" The package could not be found in the workspace.",
					);
				} else {
					logger.error(
						`Unable to resolve migrations for package (${migration.package}).  [${e.message}]`,
					);
				}

				return 1;
			}

			let migrations;

			// Check if it is a package-local location
			const localMigrations = join(packagePath, migration.collection);
			if (existsSync(localMigrations)) {
				migrations = localMigrations;
			} else {
				// Try to resolve from package location.
				// This avoids issues with package hoisting.
				try {
					const packageRequire = createRequire(packagePath + "/");
					migrations = packageRequire.resolve(migration.collection);
				} catch (e) {
					assertIsError(e);
					if (e.code === "MODULE_NOT_FOUND") {
						logger.error(
							`Migrations for package (${migration.package}) were not found.`,
						);
					} else {
						logger.error(
							`Unable to resolve migrations for package (${migration.package}).  [${e.message}]`,
						);
					}

					return 1;
				}
			}
			const result = await executeMigrations(
				workflow,
				migration.package,
				migrations,
				migration.from,
				migration.to,
				options["create-commits"],
			);

			// A non-zero value is a failure for the package's migrations
			if (result !== 0) {
				return result;
			}
		}
	}

	return success ? 0 : 1;
}
