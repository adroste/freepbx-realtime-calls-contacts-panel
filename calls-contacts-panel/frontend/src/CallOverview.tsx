import { useEffect, useRef, useState } from 'react';

import { ActiveCallRow } from './ActiveCallRow';
import { CallLogRow } from './CallLogRow';
import { CallLogsFilter } from './wsApiTypes';
import { throttle } from 'lodash';
import { useActiveCalls } from './useActiveCalls';
import { useCallLogs } from './useCallLogs';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

const LIMIT_VALUES = [10,25,50,100,250,500,1000,5000] as const;

const DEFAULT_FILTER: CallLogsFilter = { limit: 250, types: 'onlyCalls' };

export function CallOverview() {
  const { t } = useTranslation();
  const activeCalls = useActiveCalls();
  const activeCallIdsRef = useRef<string[]>([]);
  const [filter, setFilter] = useState<CallLogsFilter>(DEFAULT_FILTER);
  const throttledSetFilter = useRef(throttle(setFilter, 3000));
  const callLogs = useCallLogs(filter);
  const mainRef = useRef<HTMLDivElement>(null);
  const { register, watch } = useForm({ defaultValues: DEFAULT_FILTER });

  useEffect(() => {
    const sub = watch(fields => {
      throttledSetFilter.current({
        limit: fields.limit,
        types: fields.types,
        search: fields.search,
      });
    });
    return () => sub.unsubscribe();
  }, [watch]);

  useEffect(() => {
    const activeIds = activeCalls.map(({ id }) => id);
    // refresh call logs everytime active-calls change (by comparing the ids)
    if (
      activeIds.length !== activeCallIdsRef.current.length
      || !activeIds.every((id) => activeCallIdsRef.current.includes(id))
    ) {
      activeCallIdsRef.current = activeIds;

      // scroll back to top, so the user can't miss out on new calls
      mainRef.current?.scrollTo(0, 0);
    }
  }, [activeCalls]);

  return (
    <div className="max-h-full h-full flex flex-col">

      <header className="relative w-full bg-gray-50 py-3 px-4 grid grid-cols-[60px_1fr_2fr] gap-10">
        <div className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          {t('Type')}
        </div>
        <div className="sm:hidden col-span-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          {t('Call details')}
        </div>
        <div className="hidden sm:block text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          {t('Date')}
        </div>
        <div className="hidden lg:block text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          {t('Call details')}
        </div>

        <div className="absolute right-0 top-0 bottom-0 pr-1 flex items-center gap-1 bg-gray-50">
          <input {...register('search')} type="text" placeholder={t('Search')} 
            className="text-xs focus:ring-sky-500 focus:border-sky-500 w-40  border-gray-300 rounded-sm focus:z-10"
          />
          <select {...register(`types`)}
            className="text-xs focus:ring-sky-500 focus:border-sky-500 block border-gray-300 rounded-sm"
          >
            <option value="all">{t('All Connections')}</option>
            <option value="onlyCalls">{t('Only Calls')}</option>
          </select>
          <select {...register(`limit`)}
            className="text-xs focus:ring-sky-500 focus:border-sky-500 block border-gray-300 rounded-sm"
          >
            {LIMIT_VALUES.map(val => (
              <option key={val} value={val}>{val}</option>
            ))}
          </select>
        </div>
      </header>

      <main ref={mainRef} className="bg-white divide-y divide-gray-200 flex-1 overflow-y-scroll">
        {activeCalls.map(activeCall => (
            <ActiveCallRow
              key={activeCall.id}
              activeCall={activeCall}
            />
          ))}
        {callLogs.map(callLog => (
          <CallLogRow
            key={`${callLog.id}-${callLog.sequence}`}
            callLog={callLog}
          />
        ))}
      </main>

    </div>
  );
}