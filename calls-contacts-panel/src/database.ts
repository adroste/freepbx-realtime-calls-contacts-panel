import { Pool, createPool } from 'mysql2/promise';

import { getConfig } from './config';
import { readFile } from 'fs/promises';

const TAG = '[Database]';

const CDR_DB_NAME = 'asteriskcdrdb';
const PBX_CONFIG_OPTIONS = ['AMPDBUSER', 'AMPDBPASS', 'AMPDBHOST', 'AMPDBPORT', 'AMPDBNAME'] as const;

type PbxConfig = Record<typeof PBX_CONFIG_OPTIONS[number], string>;

let pool: Pool;
let poolCdr: Pool;

export function parseFreepbxConf(raw: string): PbxConfig {
  const lines = raw.split('\n');
  const options: Partial<PbxConfig> = {};
  lines.forEach(l => {
    const split = l.split('=');
    if (split.length !== 2)
      return;
    const key = PBX_CONFIG_OPTIONS.find(o => split[0].includes(o));
    if (!key)
      return;
    const val = split[1].match(/'([\S\s]*)'\s*;/)?.[1];
    options[key] = val || '';
  });

  if (!PBX_CONFIG_OPTIONS.every(option => typeof options[option] === 'string'))
    throw new Error(`${TAG} freepbx config does not include all required values: ${PBX_CONFIG_OPTIONS.join(', ')}`);

  return options as PbxConfig;
}

export function getDb() {
  if (!pool)
    throw new Error('database pool was not initialized')
  return pool;
}

export function getDbCdr() {
  if (!poolCdr)
    throw new Error('database pool was not initialized')
  return poolCdr;
}

export async function initDb() {
  const pbxConfigRaw = await readFile(getConfig().freepbxConfFile, 'utf-8');
  const pbxConfig = parseFreepbxConf(pbxConfigRaw);

  pool = createPool({
    user: pbxConfig.AMPDBUSER,
    host: pbxConfig.AMPDBHOST,
    database: pbxConfig.AMPDBNAME,
    password: pbxConfig.AMPDBPASS,
    port: parseInt(pbxConfig.AMPDBPORT),
  });
  
  poolCdr = createPool({
    user: pbxConfig.AMPDBUSER,
    host: pbxConfig.AMPDBHOST,
    database: CDR_DB_NAME,
    password: pbxConfig.AMPDBPASS,
    port: parseInt(pbxConfig.AMPDBPORT),
  });

  await pool.getConnection()
  await poolCdr.getConnection();
}

export function closeDb() {
  return Promise.all([poolCdr.end(), pool.end()]);
}
