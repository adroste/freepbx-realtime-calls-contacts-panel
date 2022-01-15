import { PhonebookEntry, getPhonebook, offPhonebookChange, onPhonebookChange } from './phonebook';

import { EventEmitter } from 'events';
import { getConfig } from '../config';
import { isEqual } from 'lodash';

const TAG = '[Caller ID]';
const callerIdMonitor = new EventEmitter();
let lookupTable: CallerIdLookupTable = {};

export interface CallerIdLookupTable {
  [key: string]: PhonebookEntry
}

export function createLookupTable(phonebook: PhonebookEntry[]): CallerIdLookupTable {
  const resolveLength = getConfig().callerIdResolveLength;
  const table: CallerIdLookupTable = {};

  const add = (number: string, entry: PhonebookEntry, overwrite: boolean) => {
    if (overwrite || (!overwrite && !table[number]))
      table[number] = entry; // exact match
    if (overwrite || (!overwrite && !table[number]))
      table[number.slice(-resolveLength)] = entry; // max length match
  };
  
  for (const entry of phonebook) {
    if (!entry.numbers)
      continue;
    for (const number of entry.numbers) {

      add(number.number, entry, true);

      // add lookups for number +- prefixes (e.g. area code)
      for (const prefix of getConfig().callerIdPrefixes) {
        if (number.number.startsWith(prefix)) // remove prefix
          add(number.number.slice(prefix.length), entry, false);
        else
          add(prefix + number.number, entry, false); // add prefix
      }
    }
  }

  return table;
}

export function resolveCaller(phoneNumber?: string): PhonebookEntry | null {
  if (!phoneNumber)
    return null;
  const resolveLength = getConfig().callerIdResolveLength;
  return lookupTable[phoneNumber] // exact match
    || lookupTable[phoneNumber.slice(-resolveLength)] // max length match
    || null;
}

export async function updateCallerId(phonebook: PhonebookEntry[]) {
  const nextLookupTable = createLookupTable(phonebook);
  if (isEqual(nextLookupTable, lookupTable))
    return;
  lookupTable = nextLookupTable;
  callerIdMonitor.emit('callerId');
}

export async function startCallerId() {
  console.log(TAG, 'started');
  await updateCallerId(getPhonebook());
  onPhonebookChange(updateCallerId);
}

export function stopCallerId() {
  console.log(TAG, 'stopped');
  lookupTable = {};
  offPhonebookChange(updateCallerId);
}

export function onCallerIdChange(listener: () => void) {
  callerIdMonitor.on('callerId', listener);
}

export function offCallerIdChange(listener: () => void) {
  callerIdMonitor.off('callerId', listener);
}