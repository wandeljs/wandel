import { main } from "./chunk-ZNDDGFOB.js";
import { commands } from "./chunk-UNHGXETT.js";
import { runCommand, runMain } from "./chunk-RVEKM4NR.js";

// lib/run.ts
import { fileURLToPath } from "url";
globalThis.__meta_morphix_cli__ = globalThis.__meta_morphix_cli__ || {
	// Programmatic usage fallback
	startTime: Date.now(),
	entry: fileURLToPath(
		new URL(
			import.meta.url.endsWith(".ts")
				? "../bin/metamorphix.mjs"
				: "../../bin/metamorphix.mjs",
			import.meta.url,
		),
	),
};
var runMain2 = () => runMain(main);
async function runCommand2(name, argv = process.argv.slice(2), data = {}) {
	argv.push("--no-clear");
	if (!(name in commands)) {
		throw new Error(`Invalid command ${name}`);
	}
	return await runCommand(await commands[name](), {
		rawArgs: argv,
		data: {
			overrides: data.overrides || {},
		},
	});
}

export { runMain2 as runMain, runCommand2 as runCommand };
//# sourceMappingURL=chunk-RKBTXBRA.js.map
