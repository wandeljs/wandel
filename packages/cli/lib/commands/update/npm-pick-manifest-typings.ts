declare module "npm-pick-manifest" {
	function pickManifest(
		metadata: import("./packages").PackageMetadata,
		selector: string,
	): import("./packages").PackageManifest;
	export = pickManifest;
}
