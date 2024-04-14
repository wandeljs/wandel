declare module 'npm-pick-manifest' {
  function pickManifest(
    metadata: import('./src/lib/commands/update/packages').PackageMetadata,
    selector: string
  ): import('./src/lib/commands/update/packages').PackageManifest;
  export = pickManifest;
}
