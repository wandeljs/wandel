import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		clearMocks: true,
		exclude: ["node_modules"],
		setupFiles: ["console-fail-test/setup"],
		coverage: {
			all: true,
			include: ["packages"],
			reporter: ["html", "lcov"],
		},
	},
});
