import { GROUP_TYPES, PhonebookEntry } from './wsApiTypes';
import { useContext, useEffect, useMemo, useState } from 'react';

import { wsApiContext } from './WsApiContext';

export interface PhonebookFilter {
  group: 'all' | string,
  search: string,
  sorting: 'default' | 'displayName' | 'firstName' | 'lastName' | 'company'
}

export interface PhonebookGroup {
  id: number,
  name: string,
  type: typeof GROUP_TYPES[number],
  owner?: number,
}

export function usePhonebook(filter: PhonebookFilter): [PhonebookEntry[], PhonebookGroup[]] {
  const { wsApi } = useContext(wsApiContext);
  const [phonebook, setPhonebook] = useState<PhonebookEntry[]>([]);

  useEffect(() => {
    if (!wsApi)
      return;
    wsApi.subscribePhonebook(setPhonebook);
    return () => wsApi.unsubscribePhonebook(setPhonebook);
  }, [wsApi]);

  const filtered = useMemo(() => {
    let filtered: PhonebookEntry[] = [...phonebook];
    if (filter.group !== 'all')
      filtered = phonebook.filter(e => e.groupId.toString() === filter.group);
    if (filter.search)
      filtered = phonebook.filter(e => {
        for (const key of ['groupName', 'displayName', 'firstName', 'lastName', 'company', 'title', 'address'] as const)
          if (e[key]?.toLocaleLowerCase().includes(filter.search))
            return true;
        if (e.numbers)
          for (const nr of e.numbers)
            if (nr.number.includes(filter.search))
              return true;
        return false;
      });
    return filtered;
  }, [filter.group, filter.search, phonebook]);

  const groups = useMemo(() => {
    const byId: { [id: number]: PhonebookGroup } = {};
    phonebook.forEach(entry => {
      if (!byId[entry.groupId]) {
        byId[entry.groupId] = {
          id: entry.groupId,
          name: entry.groupName,
          type: entry.groupType,
          owner: entry.groupOwner,
        };
      }
    });
    return Object.values(byId).sort((a,b) => a.name.localeCompare(b.name));
  }, [phonebook]);

  return [filtered, groups];
}