import { defineConfig } from "tsup";

export default defineConfig({
	bundle: true,
	clean: true,
	dts: true,
	entry: ["lib/**/*.ts", "!./**/*.test.*"],
	format: "esm",
	outDir: "dist",
	sourcemap: true,
});
