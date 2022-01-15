import { Link, useMatch, useSearchParams } from 'react-router-dom';
import { PhonebookFilter, usePhonebook } from './usePhonebook';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { ContactCard } from './ContactCard';
import { ContactEditor } from './ContactEditor';
import { ContactViewer } from './ContactViewer';
import { PhonebookEntry } from './wsApiTypes';
import { PlusIcon } from '@heroicons/react/solid';
import { throttle } from 'lodash';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

const DEFAULT_FILTER: PhonebookFilter = {
  group: 'all',
  search: '',
  sorting: 'default',
};

const ContactCardsMain = React.memo(({ phonebook, addPhoneNumber }: { phonebook: PhonebookEntry[], addPhoneNumber?: string | null}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 p-2">
      {phonebook.map(entry => (
        <ContactCard key={entry.id} entry={entry} addPhoneNumber={addPhoneNumber} />
      ))}
    </div>
  );
});

export function Contacts() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<PhonebookFilter>(DEFAULT_FILTER);
  const [phonebook, groups] = usePhonebook(filter);
  const throttledSetFilter = useRef(throttle(setFilter, 1000));
  const { register, watch } = useForm({ defaultValues: DEFAULT_FILTER });
  const idMatch = useMatch('/contacts/:id');
  const editIdMatch = useMatch('/contacts/:id/edit');
  const newMatch = useMatch('/contacts/new');
  const [searchParams] = useSearchParams();
  const addPhoneNumber = searchParams.get('phonenumber');

  const selectedEntry = useMemo(() => {
    const id = idMatch?.params.id || editIdMatch?.params.id;
    return phonebook.find(e => e.id.toString() === id);
  }, [editIdMatch?.params.id, idMatch?.params.id, phonebook]);

  const hideUi = !!selectedEntry;

  useEffect(() => {
    const sub = watch(fields => {
      throttledSetFilter.current({
        group: fields.group || DEFAULT_FILTER.group,
        search: fields.search || DEFAULT_FILTER.search,
        sorting: fields.sorting || DEFAULT_FILTER.sorting,
      });
    });
    return () => sub.unsubscribe();
  }, [watch]);

  return (
    <div className="max-h-full h-full flex flex-col relative">

      {!!selectedEntry && !!idMatch &&
        <ContactViewer entry={selectedEntry} />
      }
      {!!selectedEntry && !!editIdMatch &&
        <ContactEditor entry={selectedEntry} isNew={false} groups={groups} addPhoneNumber={addPhoneNumber} />
      }
      {!selectedEntry && !!newMatch &&
        <ContactEditor entry={undefined} isNew={true} groups={groups} addPhoneNumber={addPhoneNumber} />
      }

      <header className={`relative w-full bg-gray-50 py-1 px-1 flex items-center gap-2 ${hideUi && 'hidden'}`}>
        <Link
          to={addPhoneNumber ? `/contacts/new?phonenumber=${addPhoneNumber}` : '/contacts/new'}
          className="inline-flex h-8 items-center justify-center px-2 py-1 text-sm rounded-sm text-slate-900 bg-slate-100 border border-transparent hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-500"
        >
          <PlusIcon className="w-4 h-4 mr-1" />
          {t('New')}
        </Link>
        <input {...register('search')} type="text" placeholder={t('Search')}
          className="flex-1 h-8 max-w-xs rounded-sm text-xs focus:ring-sky-500 focus:border-sky-500 border-gray-300 focus:z-10"
        />
        <select {...register('group')}
          className="text-xs h-8 w-32 rounded-sm focus:ring-sky-500 focus:border-sky-500 border-gray-300"
        >
          <option value="all">{t('All Groups')}</option>
          {groups.map(g => (
            <option key={g.id} value={g.id}>{g.name} ({t('grouptype.' + g.type)})</option>
          ))}
        </select>
      </header>

      <main className={`flex-1 overflow-y-scroll ${hideUi && 'hidden'}`}>
        <ContactCardsMain phonebook={phonebook} addPhoneNumber={addPhoneNumber} />
      </main>

    </div>
  );
}