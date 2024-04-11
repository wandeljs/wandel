import { consola } from "consola";

export function setupGlobalConsole(opts: { dev?: boolean } = {}) {
	// Wrap all console logs with consola for better DX
	if (opts.dev) {
		consola.wrapAll();
	} else {
		consola.wrapConsole();
	}

	process.on("unhandledRejection", (err) =>
		consola.error("[unhandledRejection]", err),
	);

	process.on("uncaughtException", (err) =>
		consola.error("[uncaughtException]", err),
	);
}

export function askChoices(
	message: string,
	choices: Array<{ label: string; value: string; hint?: string }>,
): Promise<{ label: string; value: string; hint?: string }> {
	return consola.prompt(message, { type: "select", options: choices });
}
