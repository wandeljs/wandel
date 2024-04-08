import { commands } from "./chunk-UNHGXETT.js";
import { setupGlobalConsole } from "./chunk-RU2XIM43.js";
import { checkEngines } from "./chunk-YRJDRM4T.js";
import { defineCommand } from "./chunk-RVEKM4NR.js";

// ../../node_modules/.pnpm/std-env@3.7.0/node_modules/std-env/dist/index.mjs
var r = /* @__PURE__ */ Object.create(null);
var E = (e) =>
	globalThis.process?.env ||
	import.meta.env ||
	globalThis.Deno?.env.toObject() ||
	globalThis.__env__ ||
	(e ? r : globalThis);
var s = new Proxy(r, {
	get(e, o) {
		return E()[o] ?? r[o];
	},
	has(e, o) {
		const i = E();
		return o in i || o in r;
	},
	set(e, o, i) {
		const g = E(true);
		return (g[o] = i), true;
	},
	deleteProperty(e, o) {
		if (!o) {
			return false;
		}
		const i = E(true);
		return delete i[o], true;
	},
	ownKeys() {
		const e = E(true);
		return Object.keys(e);
	},
});
var t = (typeof process < "u" && process.env && process.env.NODE_ENV) || "";
var p = [
	["APPVEYOR"],
	["AWS_AMPLIFY", "AWS_APP_ID", { ci: true }],
	["AZURE_PIPELINES", "SYSTEM_TEAMFOUNDATIONCOLLECTIONURI"],
	["AZURE_STATIC", "INPUT_AZURE_STATIC_WEB_APPS_API_TOKEN"],
	["APPCIRCLE", "AC_APPCIRCLE"],
	["BAMBOO", "bamboo_planKey"],
	["BITBUCKET", "BITBUCKET_COMMIT"],
	["BITRISE", "BITRISE_IO"],
	["BUDDY", "BUDDY_WORKSPACE_ID"],
	["BUILDKITE"],
	["CIRCLE", "CIRCLECI"],
	["CIRRUS", "CIRRUS_CI"],
	["CLOUDFLARE_PAGES", "CF_PAGES", { ci: true }],
	["CODEBUILD", "CODEBUILD_BUILD_ARN"],
	["CODEFRESH", "CF_BUILD_ID"],
	["DRONE"],
	["DRONE", "DRONE_BUILD_EVENT"],
	["DSARI"],
	["GITHUB_ACTIONS"],
	["GITLAB", "GITLAB_CI"],
	["GITLAB", "CI_MERGE_REQUEST_ID"],
	["GOCD", "GO_PIPELINE_LABEL"],
	["LAYERCI"],
	["HUDSON", "HUDSON_URL"],
	["JENKINS", "JENKINS_URL"],
	["MAGNUM"],
	["NETLIFY"],
	["NETLIFY", "NETLIFY_LOCAL", { ci: false }],
	["NEVERCODE"],
	["RENDER"],
	["SAIL", "SAILCI"],
	["SEMAPHORE"],
	["SCREWDRIVER"],
	["SHIPPABLE"],
	["SOLANO", "TDDIUM"],
	["STRIDER"],
	["TEAMCITY", "TEAMCITY_VERSION"],
	["TRAVIS"],
	["VERCEL", "NOW_BUILDER"],
	["VERCEL", "VERCEL", { ci: false }],
	["VERCEL", "VERCEL_ENV", { ci: false }],
	["APPCENTER", "APPCENTER_BUILD_ID"],
	["CODESANDBOX", "CODESANDBOX_SSE", { ci: false }],
	["STACKBLITZ"],
	["STORMKIT"],
	["CLEAVR"],
	["ZEABUR"],
	["CODESPHERE", "CODESPHERE_APP_ID", { ci: true }],
	["RAILWAY", "RAILWAY_PROJECT_ID"],
	["RAILWAY", "RAILWAY_SERVICE_ID"],
];
function B() {
	if (globalThis.process?.env) {
		for (const e of p) {
			const o = e[1] || e[0];
			if (globalThis.process?.env[o]) {
				return { name: e[0].toLowerCase(), ...e[2] };
			}
		}
	}
	return globalThis.process?.env?.SHELL === "/bin/jsh" &&
		globalThis.process?.versions?.webcontainer
		? { name: "stackblitz", ci: false }
		: { name: "", ci: false };
}
var l = B();
var d = l.name;
function n(e) {
	return e ? e !== "false" : false;
}
var I = globalThis.process?.platform || "";
var T = n(s.CI) || l.ci !== false;
var R = n(globalThis.process?.stdout && globalThis.process?.stdout.isTTY);
var h = n(s.DEBUG);
var C = t === "test" || n(s.TEST);
var m = n(s.MINIMAL) || T || C || !R;
var a = /^win/i.test(I);
var M = /^linux/i.test(I);
var V = /^darwin/i.test(I);
var Y =
	!n(s.NO_COLOR) && (n(s.FORCE_COLOR) || ((R || a) && s.TERM !== "dumb") || T);
var _ = (globalThis.process?.versions?.node || "").replace(/^v/, "") || null;
var y = Number(_?.split(".")[0]) || null;
var W = globalThis.process || /* @__PURE__ */ Object.create(null);
var c = { versions: {} };
var w = new Proxy(W, {
	get(e, o) {
		if (o === "env") {
			return s;
		}

		if (o in e) {
			return e[o];
		}

		if (o in c) {
			return c[o];
		}
	},
});
var A = globalThis.process?.release?.name === "node";
var L = !!globalThis.Bun || !!globalThis.process?.versions?.bun;
var D = !!globalThis.Deno;
var O = !!globalThis.fastly;
var S = !!globalThis.Netlify;
var N = !!globalThis.EdgeRuntime;
var u = globalThis.navigator?.userAgent === "Cloudflare-Workers";
var b = !!globalThis.__lagon__;
var F = [
	[S, "netlify"],
	[N, "edge-light"],
	[u, "workerd"],
	[O, "fastly"],
	[D, "deno"],
	[L, "bun"],
	[A, "node"],
	[b, "lagon"],
];
function G() {
	const e = F.find((o) => o[0]);

	if (e) {
		return { name: e[1] };
	}
}
var P = G();
var K = P?.name || "";

// package.json
var package_default = {
	name: "@meta-morphix/cli",
	version: "0.0.0",
	private: true,
	description: "CLI for Code Transformations and Generations",
	repository: {
		type: "git",
		url: "https://github.com/niklas-wortmann/meta-morphix",
	},
	license: "MIT",
	author: {
		name: "Jan-Niklas Wortmann",
		email: "jwortmann719@gmail.com",
	},
	type: "module",
	main: "./lib/index.js",
	files: ["lib/", "package.json", "LICENSE.md", "README.md"],
	scripts: {
		build: "tsup",
		test: "vitest",
		tsc: "tsc",
	},
	devDependencies: {
		"@types/ini": "4.1.0",
		"@types/node": "20.12.5",
		"@types/npm-package-arg": "6.1.4",
		"@types/pacote": "11.1.8",
		"@types/semver": "7.5.8",
		"@yarnpkg/lockfile": "1.1.0",
		citty: "0.1.6",
		consola: "^3.2.3",
		ini: "4.1.2",
		"npm-package-arg": "11.0.1",
		"npm-pick-manifest": "9.0.0",
		pacote: "17.0.6",
		semver: "^7.6.0",
		"std-env": "3.7.0",
	},
	publishConfig: {
		provenance: true,
	},
};

// lib/main.ts
var main = defineCommand({
	meta: {
		name: package_default.name,
		version: package_default.version,
		description: package_default.description,
	},
	subCommands: commands,
	async setup(ctx) {
		const command = ctx.args._[0];
		const dev = command === "dev";
		setupGlobalConsole({ dev });
		let backgroundTasks;
		if (command !== "_dev" && d !== "stackblitz") {
			backgroundTasks = Promise.all([
				checkEngines(),
				// checkForUpdates(),
			]).catch((err) => console.error(err));
		}
		if (command !== "_dev" && d !== "stackblitz") {
			backgroundTasks = Promise.all([
				checkEngines(),
				// checkForUpdates(),
			]).catch((err) => console.error(err));
		}
		if (command === "init") {
			await backgroundTasks;
		}
	},
});

export { main };
//# sourceMappingURL=chunk-ZNDDGFOB.js.map
