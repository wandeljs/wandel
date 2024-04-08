import { consola } from "./chunk-XYN6RI5G.js";

// lib/utils/console.ts
function setupGlobalConsole(opts = {}) {
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

export { setupGlobalConsole };
//# sourceMappingURL=chunk-RU2XIM43.js.map
