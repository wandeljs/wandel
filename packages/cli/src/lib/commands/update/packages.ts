import npa from 'npm-package-arg';
import * as fs from 'node:fs';
import { dirname, join, resolve } from 'pathe';
import { Manifest, Packument } from 'pacote';
import { ensureNpmrc, npmrc } from '../../utils/packageManagers';
import { LoggerInstance } from '../../utils/logger';
import { logging } from '@wandeljs/core';

export interface PackageIdentifier {
  type: 'git' | 'tag' | 'version' | 'range' | 'file' | 'directory' | 'remote';
  name: string;
  scope: string | null;
  registry: boolean;
  raw: string;
  fetchSpec: string;
  rawSpec: string;
}

export interface PackageTreeNode {
  name: string;
  version: string;
  path: string;
  package: PackageJson | undefined;
}

interface PackageJson {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
}

export interface PackageMetadata
  extends Packument,
    WandelModuleManifestProperties {
  tags: Record<string, PackageManifest>;
  versions: Record<string, PackageManifest>;
}

export interface PackageManifest
  extends Manifest,
    WandelModuleManifestProperties {
  deprecated?: boolean;
}

export interface WandelModuleManifestProperties {
  wandel?: {
    migrations?: string;
    packageGroup?: string[] | Record<string, string>;
    packageGroupName?: string;
    requirements?: string[] | Record<string, string>;
  };
}

export interface NpmRepositoryPackageJson extends PackageMetadata {
  requestedName?: string;
}

export function parsePackages(_packages: string) {
  const packages: PackageIdentifier[] = [];
  for (const request of _packages.split(',')) {
    const packageIdentifier = npa(request);
    if (!packageIdentifier.registry) {
      throw new Error(
        `Package '${request}' is not a registry package identifier.`
      );
    }

    if (packages.some((v) => v.name === packageIdentifier.name)) {
      throw new Error(
        `Duplicate package '${packageIdentifier.name}' specified.`
      );
    }

    packages.push(packageIdentifier as PackageIdentifier);
  }
  return packages;
}

export async function getProjectDependencies(
  dir: string
): Promise<Map<string, PackageTreeNode>> {
  const pkg = await readPackageJson(join(dir, 'package.json'));
  if (!pkg) {
    throw new Error('Could not find package.json');
  }

  const results = new Map<string, PackageTreeNode>();
  for (const [name, version] of getAllDependencies(pkg)) {
    const packageJsonPath = findPackageJson(dir, name);
    if (!packageJsonPath) {
      continue;
    }

    results.set(name, {
      name,
      version,
      path: dirname(packageJsonPath),
      package: await readPackageJson(packageJsonPath),
    });
  }

  return results;
}

export async function readPackageJson(
  packageJsonPath: string
): Promise<PackageJson | undefined> {
  try {
    return JSON.parse((await fs.promises.readFile(packageJsonPath)).toString());
  } catch {
    return undefined;
  }
}

function getAllDependencies(pkg: PackageJson): Set<[string, string]> {
  return new Set([
    ...Object.entries(pkg.dependencies || []),
    ...Object.entries(pkg.devDependencies || []),
    ...Object.entries(pkg.peerDependencies || []),
    ...Object.entries(pkg.optionalDependencies || []),
  ]);
}

export function findPackageJson(
  packageName: string,
  baseDir: string
): string | undefined {
  try {
    return resolve(baseDir, packageName, `package.json`);
  } catch {
    return undefined;
  }
}

export async function fetchPackageMetadata(
  name: string,
  logger: LoggerInstance,
  options?: {
    registry?: string;
    usingYarn?: boolean;
  }
): Promise<PackageMetadata> {
  const { usingYarn, registry } = {
    registry: undefined,
    usingYarn: false,
    ...options,
  };

  ensureNpmrc(usingYarn);
  const { packument } = await import('pacote');
  const response = await packument(name, {
    fullMetadata: true,
    ...npmrc,
    ...(registry ? { registry } : {}),
  });

  if (!response.versions) {
    // While pacote type declares that versions cannot be undefined this is not the case.
    response.versions = {};
  }

  // Normalize the response
  const metadata: PackageMetadata = {
    ...response,
    tags: {},
  };

  if (response['dist-tags']) {
    for (const [tag, version] of Object.entries(response['dist-tags'])) {
      const manifest = metadata.versions[version];
      if (manifest) {
        metadata.tags[tag] = manifest;
      } else {
        logger.warn(
          `Package ${metadata.name} has invalid version metadata for '${tag}'.`
        );
      }
    }
  }

  return metadata;
}

const npmPackageJsonCache = new Map<
  string,
  Promise<Partial<NpmRepositoryPackageJson>>
>();

export async function getNpmPackageJson(
  packageName: string,
  logger: logging.LoggerApi,
  options: {
    registry?: string;
    usingYarn?: boolean;
    verbose?: boolean;
  } = {}
): Promise<Partial<NpmRepositoryPackageJson>> {
  const cachedResponse = npmPackageJsonCache.get(packageName);
  if (cachedResponse) {
    return cachedResponse;
  }

  const { usingYarn = false, registry } = options;
  ensureNpmrc(usingYarn);
  const { packument } = await import('pacote');
  const response = packument(packageName, {
    fullMetadata: true,
    ...npmrc,
    ...(registry ? { registry } : {}),
  }).then((response) => {
    // While pacote type declares that versions cannot be undefined this is not the case.
    if (!response.versions) {
      response.versions = {};
    }

    return response;
  });

  npmPackageJsonCache.set(packageName, response);

  return response;
}
