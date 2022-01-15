import { PhoneIcon, SwitchHorizontalIcon } from '@heroicons/react/solid';
import { useEffect, useState } from 'react';

import { ActiveCall } from './wsApiTypes';
import { Caller } from './Caller';
import { ClockIcon } from '@heroicons/react/outline';
import dayjs from 'dayjs';
import { formatDuration } from './utils';
import { t } from 'i18next';
import { useTranslation } from 'react-i18next';

export function translateActiveCallStatus(status: string) {
  switch (status.toLowerCase()) {
    case 'down':
      return t('Connecting');
    case 'ring':
    case 'ringing':
      return t('Ringing');
    case 'up':
      return t('Connected');
    default:
      return status;
  }
}

export function ActiveCallRow({ activeCall }: { activeCall: ActiveCall }) {
  const { app, establishedAt, from, status, to, via } = activeCall;
  const { t } = useTranslation();
  const [duration, setDuration] = useState(() => formatDuration(0));

  useEffect(() => {
    const start = dayjs(establishedAt);
    const update = () => {
      const diff = dayjs().diff(start, 's');
      setDuration(formatDuration(diff));
    };
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [establishedAt]);

  return (
    <div className="bg-lime-200 py-2 px-4 grid grid-cols-[60px_1fr_2fr] gap-10 gap-y-1 items-center">
      <div className="flex items-center flex-col whitespace-nowrap row-span-2 sm:row-span-1">
        <div className="flex-shrink-0 h-6 w-6">
          <PhoneIcon className="-scale-x-100 text-blue-500" />
        </div>
        <span className="text-xs text-gray-500">
          {translateActiveCallStatus(status)}
        </span>
      </div>

      <div className="flex items-center col-span-2 sm:col-span-1">
        <div className="ml-0 flex items-center sm:block">
          <div className="text-sm font-medium text-gray-900 whitespace-pre-wrap">
            {t('{{val, datetime}}', {
              val: new Date(establishedAt), formatParams: {
                val: { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }
              }
            })}
          </div>
          <div className="text-xs font-medium text-gray-500 whitespace-pre-wrap ml-2 sm:ml-0">
            <span className="px-2 inline-flex items-center py-0.5 leading-none rounded-md bg-blue-100 text-green-800">
              <ClockIcon className="h-3.5 w-3.5 mr-1 -ml-0.5" />
              {duration}
            </span>
            <span className="text-gray-400 inline-flex items-center text-[8px] ml-1">
              <SwitchHorizontalIcon className="h-3.5 w-3.5 mr-px" />
              {app}
            </span>
          </div>
        </div>
      </div>

      <div className="row-start-2 col-span-2 col-start-2 sm:row-start-1 sm:col-span-1 sm:col-start-3">
        <div className="text-gray-500 font-semibold text-[10px] leading-none">
          {t('Caller')}
        </div>
        <div className="text-gray-900 leading-5 flex flex-wrap">
          <Caller callerInfo={from} />
        </div>
        <div className="text-gray-500 font-semibold text-[10px] leading-none mt-1">
          {t('Callee')}
        </div>
        <div className="text-gray-900 leading-5 flex items-end flex-wrap">
          <Caller callerInfo={to} />
          <span className="ml-2 text-gray-300 text-xs">{t('via')}: {via}</span>
        </div>
      </div>
    </div>
  );
}