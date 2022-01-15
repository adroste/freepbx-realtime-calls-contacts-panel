import { ResultSetHeader, RowDataPacket } from 'mysql2';

import { EventEmitter } from 'events';
import { getConfig } from '../config';
import { getDb } from '../database';
import { isEqual } from 'lodash';
import { v1 as uuidv1 } from 'uuid';

const TAG = '[Phonebook Monitor]';
const phonebookMonitor = new EventEmitter();
let checkInterval: NodeJS.Timer;
let phonebook: PhonebookEntry[] = [];

export const PHONE_NUMBER_TYPES = ['cell', 'work', 'internal', 'home', 'other'] as const;
export const GROUP_TYPES = ['internal', 'external', 'private'] as const;

export interface PhoneNumber {
  number: string,
  type: typeof PHONE_NUMBER_TYPES[number],
  flags: ('sms' | 'fax')[],
}

export interface PhonebookEntry {
  id: number, // entryid
  uuid?: string,
  groupId: number,
  groupName: string,
  groupType: typeof GROUP_TYPES[number],
  groupOwner?: number,
  combinedName: string, // derived from displayName, firstName and lastName
  displayName?: string,
  firstName?: string,
  lastName?: string,
  company?: string,
  title?: string,
  address?: string,
  numbers?: PhoneNumber[],
  emails?: string[],
  websites?: string[],
}

interface GroupEntriesResultRow extends RowDataPacket {
  id: number,
  displayname?: string,
  fname?: string,
  lname?: string,
  title?: string,
  company?: string,
  address?: string,
  uuid?: string,
  groupid: number,
  groupowner: number, // -1 => no owner / system
  groupname: string,
  grouptype: typeof GROUP_TYPES[number],
}

interface EmailsResultRow extends RowDataPacket {
  id: number,
  email?: string,
}

interface NumbersResultRow extends RowDataPacket {
  id: number,
  number?: string,
  type?: typeof PHONE_NUMBER_TYPES[number],
  flags?: string,
}

interface WebsitesResultRow extends RowDataPacket {
  id: number,
  website?: string,
}

export type DisplayNameFormat = 'FirstNameLastName' | 'LastNameFirstName';

function getCombinedName(entry: GroupEntriesResultRow): string {
  // TODO make format adjustable
  const format: DisplayNameFormat = 'FirstNameLastName';
  if (entry.displayname) // displayname overrides everything
    return entry.displayname;

  const fname = `${entry.title || ''} ${entry.fname || ''}`.trim();
  const lname = (entry.lname || '').trim();
  if (fname && lname) {
    if (format === 'FirstNameLastName')
      return `${fname} ${lname}`;
    else
      return `${lname}, ${fname}`;
  }
  return fname || lname;
}

async function queryPhonebook(): Promise<PhonebookEntry[]> {
  const [groupEntries] = await getDb().query<GroupEntriesResultRow[]>(`
SELECT e.id, e.displayname, e.fname, e.lname, e.title, e.company, e.address, e.uuid, e.groupid,
	g.name AS groupname, g.type AS grouptype, g.owner AS groupowner
FROM contactmanager_group_entries e 
LEFT JOIN contactmanager_groups g
	ON e.groupid = g.id
  `);

  const [emails] = await getDb().query<EmailsResultRow[]>(`
SELECT e.id, m.email
FROM contactmanager_group_entries e 
JOIN contactmanager_entry_emails m
	ON e.id = m.entryid
  `);

  const [numbers] = await getDb().query<NumbersResultRow[]>(`
SELECT e.id, n.number, n.type, n.stripped, n.flags
FROM contactmanager_group_entries e 
JOIN contactmanager_entry_numbers n 
  ON n.entryid = e.id
  `);

  const [websites] = await getDb().query<WebsitesResultRow[]>(`
SELECT e.id, w.website
FROM contactmanager_group_entries e 
JOIN contactmanager_entry_websites w
  ON e.id = w.entryid
  `);

  function mapById<T extends { id: number }>(arr: T[]): { [id: number]: T[] | undefined } {
    return arr.reduce((byId, o) => {
      if (byId[o.id])
        byId[o.id].push(o);
      else
        byId[o.id] = [o];
      return byId;
    }, {} as { [id: number]: T[] })
  }
  const emailsById = mapById(emails);
  const numbersById = mapById(numbers);
  const websitesById = mapById(websites);

  const entries: PhonebookEntry[] = groupEntries.map(e => {
    const numbers: PhoneNumber[] = [];
    numbersById[e.id]?.forEach(({ number, type, flags }) => {
      if (number && type)
        numbers.push({
          number,
          type,
          flags: flags?.split('|').filter(x => x) as ('fax' | 'sms')[] || []
        });
    });
    const emails = emailsById[e.id]?.map(email => email.email).filter(x => x) as string[] | undefined;
    const websites = websitesById[e.id]?.map(website => website.website).filter(x => x) as string[] | undefined;
    return {
      id: e.id,
      uuid: e.uuid,
      groupId: e.groupid,
      groupName: e.groupname,
      groupType: e.grouptype,
      groupOwner: e.groupowner === -1 ? undefined : e.groupowner,
      combinedName: getCombinedName(e),
      displayName: e.displayname,
      firstName: e.fname,
      lastName: e.lname,
      company: e.company,
      title: e.title,
      address: e.address,
      numbers,
      emails,
      websites,
    };
  });

  return entries.sort((a, b) => a.combinedName.localeCompare(b.combinedName));
}

export async function updatePhonebook() {
  const nextPhonebook = await queryPhonebook();
  if (isEqual(nextPhonebook, phonebook))
    return;
  phonebook = nextPhonebook;
  phonebookMonitor.emit('phonebook', phonebook);
}

export function getPhonebook() {
  return phonebook;
}

export async function monitorPhonebook() {
  await updatePhonebook();
  checkInterval = setInterval(updatePhonebook,
    getConfig().phonebookCheckIntervalMs);
  console.log(TAG, 'started');
}

export function stopMonitorPhonebook() {
  clearInterval(checkInterval);
  console.log(TAG, 'stopped');
}

export function onPhonebookChange(listener: (phonebook: PhonebookEntry[]) => void) {
  phonebookMonitor.on('phonebook', listener);
}

export function offPhonebookChange(listener: (phonebook: PhonebookEntry[]) => void) {
  phonebookMonitor.off('phonebook', listener);
}


// --- CRUD Entries ---

async function isEntryUpdateAllowed(id: number): Promise<boolean> {
  interface Res extends RowDataPacket { type: string };
  const [res] = await getDb().query<Res[]>(`
SELECT g.type
FROM contactmanager_group_entries e
JOIN contactmanager_groups g
	ON e.groupid = g.id
WHERE e.id = ?
  `, [id]);
  const type = res[0]?.type
  return type === 'external' || type === 'private';
}

async function checkGroupExists(groupId?: number): Promise<boolean> {
  if (typeof groupId !== 'number')
    return false;
  const [res] = await getDb().query('SELECT id FROM contactmanager_groups WHERE id = ?', [groupId]);
  return Array.isArray(res) && !!res?.length;
}

function checkNumbersAreWritable(numbers?: Partial<PhoneNumber[]>): boolean {
  if (!numbers || !Array.isArray(numbers))
    return false;
  const acceptedTypes = PHONE_NUMBER_TYPES.filter(t => t !== 'internal');
  for (const n of numbers) {
    if (
      !n
      || !n.number
      || typeof n.number !== 'string'
      || !n.type
      || !acceptedTypes.includes(n.type)
      || !Array.isArray(n.flags)
      || n.flags.some((v: unknown) => v !== 'sms' && v !== 'fax')
    ) {
      return false;
    }
  }
  return true;
}

async function deleteEntryEmails(id: number) {
  await getDb().query<ResultSetHeader>(`
DELETE FROM contactmanager_entry_emails
WHERE entryid = ?
  `, [id]);
}

async function deleteEntryNumbers(id: number) {
  await getDb().query<ResultSetHeader>(`
DELETE FROM contactmanager_entry_numbers
WHERE entryid = ?
  `, [id]);
}

async function deleteEntryImages(id: number) {
  await getDb().query<ResultSetHeader>(`
DELETE FROM contactmanager_entry_images
WHERE entryid = ?
  `, [id]);
}

async function deleteEntrySpeedDials(id: number) {
  await getDb().query<ResultSetHeader>(`
DELETE FROM contactmanager_entry_speeddials
WHERE entryid = ?
  `, [id]);
}

async function deleteEntryWebsites(id: number) {
  await getDb().query<ResultSetHeader>(`
DELETE FROM contactmanager_entry_websites
WHERE entryid = ?
  `, [id]);
}

async function deleteEntryXmpps(id: number) {
  await getDb().query<ResultSetHeader>(`
DELETE FROM contactmanager_entry_xmpps
WHERE entryid = ?
  `, [id]);
}

export async function deleteEntry(id?: number): Promise<boolean> {
  if (typeof id !== 'number' || !await isEntryUpdateAllowed(id))
    return false;

  try {
    await deleteEntryEmails(id);
    await deleteEntryNumbers(id);
    await deleteEntryImages(id);
    await deleteEntrySpeedDials(id);
    await deleteEntryWebsites(id);
    await deleteEntryXmpps(id);
    await getDb().query<ResultSetHeader>(`
DELETE FROM contactmanager_group_entries
WHERE id = ?
    `, [id]);
    return true;
  } catch (err) {
    console.error(err);
    return false;
  } finally {
    updatePhonebook();
  }
}

async function insertEntryEmails(id: number, emails: string[]) {
  const values = emails
    .filter(email => email.trim())
    .map(email => [id, email.trim()]);
  if (!values.length)
    return;
  await getDb().query<ResultSetHeader>(`
INSERT INTO contactmanager_entry_emails (entryid, email)
VALUES ?
  `, [values]);
}

async function insertEntryNumbers(id: number, numbers: PhoneNumber[]) {
  // from: https://github.com/FreePBX/contactmanager/blob/dee20fc7c179c1f1168dfb0b448b820d4d087f2b/Contactmanager.class.php#L2189
  // ':entryid' => $entryid,
  // ':number' => $number['number'],
  // ':extension' => isset($number['extension']) ? $number['extension'] : "",
  // ':type' => isset($number['type']) ? $number['type'] : "",
  // ':flags' => !empty($number['flags']) ? implode('|', $number['flags']) : "",
  // $data[':countrycode'] = null;
  // $data[':nationalnumber'] = null;
  // $data[':E164'] = null;
  // $data[':regioncode'] = null;
  // $data[':stripped'] = preg_replace("/[^0-9\*#]/","",$data[':number']);
  // $data[':locale'] = '';
  // $data[':possibleshort'] = null;
  const values = numbers
    .filter(nr => nr.number.trim())
    .map(nr => [
      id,
      nr.number.trim(),
      '', // extension
      nr.type,
      nr.flags.filter(f => ['sms', 'fax'].includes(f)).join('|'), // flags: sms / fax 
      null, // countrycode
      null, // nationalnumber
      null, // e164
      null, // regioncode
      nr.number.trim().replace(/[^0-9*#]/, ''), // stripped
      '', // locale
      null, // possibleshort
    ]);
  if (!values.length)
    return;
  await getDb().query<ResultSetHeader>(`
INSERT INTO contactmanager_entry_numbers (entryid, number, extension, type, flags, countrycode, nationalnumber, E164, regioncode, stripped, locale, possibleshort) 
VALUES ?
  `, [values]);
}

async function insertEntryWebsites(id: number, websites: string[]) {
  const values = websites
    .filter(website => website.trim())
    .map(website => [id, website.trim()]);
  if (!values.length)
    return;
  await getDb().query<ResultSetHeader>(`
INSERT INTO contactmanager_entry_websites (entryid, website)
VALUES ?
  `, [values]);
}

export async function updateEntry(id?: number, entry?: Partial<PhonebookEntry>): Promise<boolean> {
  if (
    typeof id !== 'number'
    || !await isEntryUpdateAllowed(id)
    || !entry?.numbers?.length
    || !checkNumbersAreWritable(entry.numbers)
    || !await checkGroupExists(entry.groupId)
  ) {
    console.dir(entry);
    return false;
  }

  try {
    await deleteEntryEmails(id);
    if (entry.emails?.length)
      await insertEntryEmails(id, entry.emails);

    await deleteEntryNumbers(id);
    await insertEntryNumbers(id, entry.numbers);


    await deleteEntryWebsites(id);
    if (entry.websites?.length)
      await insertEntryWebsites(id, entry.websites);

    // await deleteEntryImages(id); // no editable from ui right now
    // await deleteEntrySpeedDials(id); // not editable from ui right now
    // await deleteEntryXmpps(id); // not editable from ui right now

    await getDb().query<ResultSetHeader>(`
UPDATE contactmanager_group_entries 
SET groupid = ?, displayname = ?, fname = ?, lname = ?, title = ?, company = ?, address = ? 
WHERE id = ?
    `, [
      entry.groupId,
      entry.displayName?.trim() || '',
      entry.firstName?.trim() || '',
      entry.lastName?.trim() || '',
      entry.title?.trim() || '',
      entry.company?.trim() || '',
      entry.address?.trim() || '',
      id
    ]);
    return true;
  } catch (err) {
    console.error(err);
    return false;
  } finally {
    updatePhonebook();
  }
}

export async function createEntry(entry?: Partial<PhonebookEntry>): Promise<number> {
  if (
    !entry?.numbers?.length
    || !checkNumbersAreWritable(entry.numbers)
    || !await checkGroupExists(entry.groupId)
  ) {
    return -1;
  }

  try {
    const [res] = await getDb().query<ResultSetHeader>(`
INSERT INTO contactmanager_group_entries (groupid, user, displayname, fname, lname, title, company, address, uuid) 
VALUES (?)
    `, [[
      entry.groupId,
      -1,
      entry.displayName?.trim() || '',
      entry.firstName?.trim() || '',
      entry.lastName?.trim() || '',
      entry.title?.trim() || '',
      entry.company?.trim() || '',
      entry.address?.trim() || '',
      uuidv1()
    ]]);

    const id = res.insertId;
    await insertEntryNumbers(id, entry.numbers);
    if (entry.emails?.length)
      await insertEntryEmails(id, entry.emails);
    if (entry.websites?.length)
      await insertEntryWebsites(id, entry.websites);
    return id;
  } catch (err) {
    console.error(err);
    return -1;
  } finally {
    updatePhonebook();
  }
}