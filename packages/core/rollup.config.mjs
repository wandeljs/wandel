// @ts-check
import { defineConfig } from "rollup";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import replace from "@rollup/plugin-replace";
import dts from "rollup-plugin-dts";
import ts from "rollup-plugin-typescript2";

const entries = ["lib/index.ts"];

const plugins = [
	ts({
		check: false,
	}),
	replace({
		"DebugFlags.InDebugMode": "false",
		preventAssignment: true,
	}),
	nodeResolve(),
	commonjs(),
];

export default defineConfig([
	{
		input: entries,
		output: {
			dir: "dist",
			format: "esm",
			entryFileNames: "[name].mjs",
			chunkFileNames: () => {
				return "chunks-[name].mjs";
			},
		},
		plugins: [...plugins],
	},
	{
		input: entries,
		output: {
			dir: "dist",
			format: "esm",
			chunkFileNames: "chunk-[name].d.mts",
			entryFileNames: (f) => `${f.name.replace(/src[\\\/]/, "")}.d.mts`,
		},
		plugins: [
			dts({
				respectExternal: true,
			}),
		],
		onwarn: (warning, warn) => {
			if (!/Circular|an empty chunk/.test(warning.message)) {
				warn(warning);
			}
		},
		external: [],
	},
]);
