import AMI from 'yana';
import { getConfig } from '../config';
import ini from 'ini';
import { readFile } from 'fs/promises';

const TAG = '[AMI]';
let ami: AMI;

interface AmiConfig {
  port: number,
  adminPassword: string,
}

function parseManagerConf(raw: string): AmiConfig {
  const obj = ini.parse(raw);
  const port = parseInt(obj['general']['port']);
  const adminPassword = obj['admin']['secret'];
  if (!port || !adminPassword)
    throw new Error(`${TAG} asterisk manager config does not include required values: general->port, admin->secret`);
  return {
    port,
    adminPassword
  };
}

export async function initAmi() {
  const managerConfigRaw = await readFile(getConfig().managerConfFile, 'utf-8');
  const managerConfig = parseManagerConf(managerConfigRaw);

  ami = new AMI({
    port: managerConfig.port,
    host: '127.0.0.1',
    login: 'admin',
    password: managerConfig.adminPassword,
    events: 'on',
    reconnect: true
  });

  await ami.connect();
  console.log(TAG, 'asterisk manager interface connected');
}

export function getAmi() {
  if (!ami)
    throw new Error('asterisk manager interface was not initialized')
  return ami;
}
