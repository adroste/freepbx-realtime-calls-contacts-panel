import { PhonebookEntry, createEntry, deleteEntry, monitorPhonebook } from './phonebook';
import { closeDb, initDb } from '../database';

import { loadConfig } from '../config';

beforeAll(async () => {
  await loadConfig();
  await initDb();
  await monitorPhonebook();
});

describe('phonebook', () => {
  it.skip('should perform delete entry queries', async () => {
    const res = await deleteEntry(-999);
    expect(res).toBe(false);
  });

  it.skip('should create and delete an entry', async () => {
    expect.assertions(1);
    const entry: Partial<PhonebookEntry> = {
      groupId: 2,
      displayName: '__TEST__displayname',
      firstName: '__TEST__firstname',
      lastName: '__TEST__lastname',
      title: '__TEST__title',
      company: '__TEST__company',
      address: '__TEST__address',
      emails: ['__TEST__email1', '__TEST__email2'],
      websites: ['__TEST__website1', '__TEST__website2'],
      numbers: [
        {
          number: '+99123123123',
          type: 'cell',
          flags: [],
        },
        {
          number: '123123123999',
          type: 'work',
          flags: ['fax'],
        }
      ]
    };
    const id = await createEntry(entry);
    const res = await deleteEntry(id);
    expect(res).toBe(true);
  });
});

afterAll(async () => {
  await closeDb();
});