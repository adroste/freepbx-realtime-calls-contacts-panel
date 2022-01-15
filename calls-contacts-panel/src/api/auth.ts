import bcrypt from 'bcrypt';
import { getDb } from '../database';

export async function checkUsernamePassword(username: string, password: string) {
  const [rows] = await getDb().query('SELECT id, password FROM userman_users WHERE username = ?', [username]);
  if (!Array.isArray(rows) || rows.length !== 1)
    return false;
  const res = rows[0] as { id: number, password: string };
  return bcrypt.compare(password, res.password);
}

export async function getUserExtension(username: string) {
  const [rows] = await getDb().query('SELECT default_extension FROM userman_users WHERE username = ?', [username]);
  if (!Array.isArray(rows) || rows.length !== 1)
    return false;
  const res = rows[0] as { default_extension: string };
  return res.default_extension || '';
}

export async function checkUserModulePermissions(username: string, modules: string[] = ['cdr', 'contactmanager']) {
  const [rawRows] = await getDb().query(`
SELECT s.key, s.val 
FROM userman_users_settings s
WHERE uid = (SELECT id FROM userman_users WHERE username = ?)
	AND s.key IN ('pbx_admin', 'pbx_modules')
`, [username]);
  if (!Array.isArray(rawRows))
    return false;
  const rows = rawRows as Array<{ key: 'pbx_admin' | 'pbx_modules', val: Buffer }>;
  const keyVal = rows.reduce((keyVal, cur) => {
    keyVal[cur.key] = cur.val.toString();
    return keyVal;
  }, {} as { pbx_admin?: string, pbx_modules?: string });
  return keyVal.pbx_admin === '1' 
    || modules.every(module => keyVal.pbx_modules?.includes(module))
}