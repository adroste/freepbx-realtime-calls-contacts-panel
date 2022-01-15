import { checkUserModulePermissions, checkUsernamePassword } from './auth';
import { closeDb, initDb } from '../database';

import { loadConfig } from '../config';

beforeAll(async () => {
  await loadConfig();
  await initDb();
})

describe('auth - checkUsernamePassword', () => {
  it('should return false on empty inputs', async () => {
    const res = await checkUsernamePassword('', '');
    expect(res).toBe(false);
  });
});

describe('auth - checkUserModulePermissions', () => {
  it('should return false on empty inputs', async () => {
    const res = await checkUserModulePermissions('');
    expect(res).toBe(false);
  });
});

afterAll(async () => {
  await closeDb();
})