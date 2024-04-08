import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		clearMocks: true,
		exclude: ["lib", "node_modules"],
		setupFiles: ["console-fail-test/setup"],
	},
});
