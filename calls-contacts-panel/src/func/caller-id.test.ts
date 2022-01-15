import { getConfig, loadConfig } from '../config';
import { resolveCaller, updateCallerId } from './caller-id';

import { PhonebookEntry } from './phonebook';

const entries: PhonebookEntry[] = [
  {
    combinedName: 'a',
    groupId: -1,
    groupName: 'gn',
    groupType: 'external',
    id: 5,
    numbers: [
      {
        flags: [],
        number: '404',
        type: 'cell',
      }
    ]
  },
  {
    combinedName: 'b',
    groupId: -1,
    groupName: 'gn',
    groupType: 'external',
    id: 6,
    numbers: [
      {
        flags: [],
        number: '08888403',
        type: 'cell',
      }
    ]
  },
]

beforeAll(async () => {
  await loadConfig();
  getConfig().callerIdPrefixes = ['08888', '+238888'];
  await updateCallerId(entries);
});

describe('caller-id', () => {
  it('should resolve an exact match', () => {
    const match = resolveCaller('404');
    expect(match).toBe(entries[0]);
  });

  it('should resolve incoming (with prefix) -> phonebook (no prefix)', () => {
    const match = resolveCaller('08888404');
    expect(match).toBe(entries[0]);
  });

  it('should resolve incoming (no prefix) -> phonebook (with prefix)', () => {
    const match = resolveCaller('403');
    expect(match).toBe(entries[1]);
  });
});
