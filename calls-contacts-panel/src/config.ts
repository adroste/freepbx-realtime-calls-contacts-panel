import { getProperPath } from './util';
import { readJson } from 'fs-extra';

const TAG = '[Config loader]';

export interface Config {
  // PBX paths
  freepbxConfFile: string,
  managerConfFile: string,

  // app paths
  serviceInstallFile: string,
  frontendBuildDir: string,

  // runtime config
  activeCallsCheckIntervalMs: number,
  callerIdPrefixes: string[],
  callerIdResolveLength: number,
  callLogsCheckIntervalMs: number,
  httpPort: number,
  phonebookCheckIntervalMs: number,
}

let config: Config;

function fixPaths(config: Config) {
  (Object.keys(config) as Array<keyof Config>).forEach(key => {
    if (typeof config[key] === 'string')
      (config[key] as string) = getProperPath(config[key] as string);
  });
  return config;
}

export async function loadConfig() {
  const defaultConf = await readJson(getProperPath('./config.default.json'));
  let devConf, localConf;
  if (process.env.NODE_ENV === 'development')
    devConf = await readJson(getProperPath('./config.dev.json'));
  try {
    localConf = await readJson(getProperPath('./config.local.json'));
  } catch (_) {
    console.log(TAG, 'no local config (config.local.json) detected, using default values');
  }

  const merged: Config = {
    ...defaultConf,
    ...devConf,
    ...localConf,
  };
  config = fixPaths(merged);
  console.log(TAG, 'config loaded', config);
}

export function getConfig(): Config {
  if (!config)
    throw new Error('config was not loaded')
  return config;
}