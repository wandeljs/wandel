import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, parse, resolve } from 'pathe';
import { findup } from './fs';
import { homedir } from 'node:os';
import * as ini from 'ini';
import * as lockfile from '@yarnpkg/lockfile';

export const packageManagerLocks = {
  yarn: 'yarn.lock',
  npm: 'package-lock.json',
  pnpm: 'pnpm-lock.yaml',
  bun: 'bun.lockb',
};

export type PackageManager = keyof typeof packageManagerLocks;

export function getPackageManager(rootDir: string) {
  return findup(rootDir, (dir) => {
    for (const name in packageManagerLocks) {
      const path = packageManagerLocks[name as PackageManager];
      if (path && existsSync(resolve(dir, path))) {
        return name;
      }
    }
    return null;
  }) as PackageManager | null;
}

export function getPackageManagerVersion(name: string) {
  return execSync(`${name} --version`).toString('utf8').trim();
}

interface PackageManagerOptions extends Record<string, unknown> {
  forceAuth?: Record<string, unknown>;
}

export let npmrc: PackageManagerOptions; // TODO REFACTOR TO NOT GLOBAL VARIABLE

export function ensureNpmrc(usingYarn: boolean): void {
  if (!npmrc) {
    npmrc = readOptions(false);

    if (usingYarn) {
      npmrc = { ...npmrc, ...readOptions(true) };
    }
  }
}

function readOptions(yarn = false): PackageManagerOptions {
  const cwd = process.cwd(); // TODO REFACTOR TO ARGUMENT CWD
  const baseFilename = yarn ? 'yarnrc' : 'npmrc';
  const dotFilename = '.' + baseFilename;

  let globalPrefix: string;
  if (process.env['PREFIX']) {
    globalPrefix = process.env['PREFIX'];
  } else {
    globalPrefix = dirname(process.execPath);
    if (process.platform !== 'win32') {
      globalPrefix = dirname(globalPrefix);
    }
  }

  const defaultConfigLocations = [
    (!yarn && process.env['NPM_CONFIG_GLOBALCONFIG']) ||
      join(globalPrefix, 'etc', baseFilename),
    (!yarn && process.env['NPM_CONFIG_USERCONFIG']) ||
      join(homedir(), dotFilename),
  ];

  const projectConfigLocations: string[] = [join(cwd, dotFilename)];
  if (yarn) {
    const root = parse(cwd).root;
    for (
      let curDir = dirname(cwd);
      curDir && curDir !== root;
      curDir = dirname(curDir)
    ) {
      projectConfigLocations.unshift(join(curDir, dotFilename));
    }
  }

  let rcOptions: PackageManagerOptions = {};
  for (const location of [
    ...defaultConfigLocations,
    ...projectConfigLocations,
  ]) {
    if (existsSync(location)) {
      const data = readFileSync(location, 'utf8');
      // Normalize RC options that are needed by 'npm-registry-fetch'.
      // See: https://github.com/npm/npm-registry-fetch/blob/ebddbe78a5f67118c1f7af2e02c8a22bcaf9e850/index.js#L99-L126
      const rcConfig: PackageManagerOptions = yarn
        ? lockfile.parse(data)
        : ini.parse(data);

      rcOptions = normalizeOptions(rcConfig, location, rcOptions);
    }
  }

  const envVariablesOptions: PackageManagerOptions = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (!value) {
      continue;
    }

    let normalizedName = key.toLowerCase();
    if (normalizedName.startsWith('npm_config_')) {
      normalizedName = normalizedName.substring(11);
    } else if (yarn && normalizedName.startsWith('yarn_')) {
      normalizedName = normalizedName.substring(5);
    } else {
      continue;
    }

    if (
      normalizedName === 'registry' &&
      rcOptions['registry'] &&
      value === 'https://registry.yarnpkg.com' &&
      process.env['npm_config_user_agent']?.includes('yarn')
    ) {
      // When running `ng update` using yarn (`yarn ng update`), yarn will set the `npm_config_registry` env variable to `https://registry.yarnpkg.com`
      // even when an RC file is present with a different repository.
      // This causes the registry specified in the RC to always be overridden with the below logic.
      continue;
    }

    normalizedName = normalizedName.replace(/(?!^)_/g, '-'); // don't replace _ at the start of the key.s
    envVariablesOptions[normalizedName] = value;
  }

  return normalizeOptions(envVariablesOptions, undefined, rcOptions);
}

function normalizeOptions(
  rawOptions: PackageManagerOptions,
  location = process.cwd(),
  existingNormalizedOptions: PackageManagerOptions = {}
): PackageManagerOptions {
  const options = { ...existingNormalizedOptions };

  for (const [key, value] of Object.entries(rawOptions)) {
    let substitutedValue = value;

    // Substitute any environment variable references.
    if (typeof value === 'string') {
      substitutedValue = value.replace(
        /\$\{([^}]+)\}/,
        (_, name) => process.env[name] || ''
      );
    }

    switch (key) {
      // Unless auth options are scope with the registry url it appears that npm-registry-fetch ignores them,
      // even though they are documented.
      // https://github.com/npm/npm-registry-fetch/blob/8954f61d8d703e5eb7f3d93c9b40488f8b1b62ac/README.md
      // https://github.com/npm/npm-registry-fetch/blob/8954f61d8d703e5eb7f3d93c9b40488f8b1b62ac/auth.js#L45-L91
      case '_authToken':
      case 'token':
      case 'username':
      case 'password':
      case '_auth':
      case 'auth':
        options['forceAuth'] ??= {};
        options['forceAuth'][key] = substitutedValue;
        break;
      case 'noproxy':
      case 'no-proxy':
        options['noProxy'] = substitutedValue;
        break;
      case 'maxsockets':
        options['maxSockets'] = substitutedValue;
        break;
      case 'https-proxy':
      case 'proxy':
        options['proxy'] = substitutedValue;
        break;
      case 'strict-ssl':
        options['strictSSL'] = substitutedValue;
        break;
      case 'local-address':
        options['localAddress'] = substitutedValue;
        break;
      case 'cafile':
        if (typeof substitutedValue === 'string') {
          const cafile = resolve(dirname(location), substitutedValue);
          try {
            options['ca'] = readFileSync(cafile, 'utf8').replace(
              /\r?\n/g,
              '\n'
            );
          } catch {
            // TODO Handle Error
          }
        }
        break;
      case 'before':
        options['before'] =
          typeof substitutedValue === 'string'
            ? new Date(substitutedValue)
            : substitutedValue;
        break;
      default:
        options[key] = substitutedValue;
        break;
    }
  }

  return options;
}
