import { closeDb, initDb } from '../database';

import { loadConfig } from '../config';
import { queryCdrCount } from './call-logs';

beforeAll(async () => {
  await loadConfig();
  await initDb();
});

describe('call-logs', () => {
  it('should query count without error', async () => {
    const c = await queryCdrCount();
    expect(typeof c === 'number').toBe(true);
  });
  // it('should update call logs without error', async () => {
  //   expect.assertions(1);
  //   await expect(updateCallLogs()).resolves.toBeUndefined();
  // });

  // it('should include at least one correct element', async () => {
  //   expect.assertions(7);
  //   await updateCallLogs();
  //   const callLogs = getCallLogs();
  //   expect(callLogs[0]).toBeTruthy();
  //   expect(callLogs[0].id).toBeTruthy();
  //   expect(callLogs[0].direction).toBeTruthy();
  //   expect(callLogs[0].endTime).toBeTruthy();
  //   expect(callLogs[0].startTime).toBeTruthy();
  //   expect(callLogs[0].extCaller).toBeTruthy();
  //   expect(callLogs[0].segments[0]).toBeTruthy();
  // });
});

afterAll(async () => {
  await closeDb();
});