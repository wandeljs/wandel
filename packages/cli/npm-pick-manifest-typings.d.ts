declare module "npm-pick-manifest" {
	function pickManifest(
		metadata: import("./lib/commands/update/packages").PackageMetadata,
		selector: string,
	): import("./lib/commands/update/packages").PackageManifest;
	export = pickManifest;
}
