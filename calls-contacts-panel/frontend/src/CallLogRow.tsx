import { MailIcon, MicrophoneIcon, PhoneIncomingIcon, PhoneOutgoingIcon, XIcon } from '@heroicons/react/solid';

import { CallLog } from './wsApiTypes';
import { Caller } from './Caller';
import { ClockIcon } from '@heroicons/react/outline';
import { formatDuration } from './utils';
import { useTranslation } from 'react-i18next';

export function CallLogRow({ callLog }: { callLog: CallLog }) {
  const { direction, durationSec, from, linkedLogs, recording, startTime, status, to, via } = callLog;
  const { t } = useTranslation();

  // Calculation of total duration is not easy
  // due to the fact that there can be linked logs that contain 
  // internal local connection (from x -> y -> z).
  // Therefore we cannot just sum the durations of all linked logs.
  // Best result (for now) is achieved by just displaying
  // the duration of the last "station" of the call.
  // Most times this is equal to the talking duration (human to human).
  const totalDuration = linkedLogs?.[linkedLogs?.length - 1].durationSec || durationSec || 0;
  // add(0,'s') is a workaround to prevent undefined values in output
  // let duration = dayjs.duration({ seconds: totalDuration }).add(0,'s').format('HH:mm:ss');
  const duration = formatDuration(totalDuration);

  const toVoicemail = linkedLogs?.[0]?.lastApp?.toLowerCase() === 'voicemail';

  return (
    <div className="py-1 px-4 grid grid-cols-[60px_1fr_2fr] gap-10 gap-y-1 items-center">
      <div className="flex items-center flex-col whitespace-nowrap row-span-2 sm:row-span-1">
        <div className="flex-shrink-0 h-6 w-6">
          {direction === 'incoming'
            ? <PhoneIncomingIcon className="-scale-x-100 text-green-600" />
            : <PhoneOutgoingIcon className="text-red-600" />
          }
        </div>
        <span className="text-xs text-gray-500">
          {direction === 'incoming' ? t('Incoming') : t('Outgoing')}
        </span>
      </div>

      <div className="flex items-center col-span-2 sm:col-span-1">
        <div className="ml-0 flex items-center sm:block">
          <div className="text-sm font-medium text-gray-900 whitespace-pre-wrap">
            {t('{{val, datetime}}', {
              val: new Date(startTime), formatParams: {
                val: { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }
              }
            })}
          </div>
          <div className="text-xs font-medium text-gray-500 whitespace-pre-wrap ml-2 sm:ml-0">
            {status === 'ANSWERED' 
              ? (
                <span className="px-2 inline-flex items-center py-0.5 leading-none rounded-md bg-green-100 text-green-800">
                  <ClockIcon className="h-3.5 w-3.5 mr-1 -ml-0.5" />
                  {duration}
                </span>
              ) : (
                <span title={t('Not Answered')} className="px-2 inline-flex items-center py-0.5 leading-none rounded-md bg-red-100 text-red-800">
                  <XIcon className="h-3.5 w-3.5 mr-0.5 -ml-0.5" />
                  {duration}
                </span>
              )
            }
            {toVoicemail && 
              <span className="text-sky-600 inline-flex items-center text-[8px] ml-1">
                <MailIcon className="h-3.5 w-3.5 mr-px" />
                {t('Voicemail')}
              </span>
            }
            {recording && 
              <span className="text-red-700 inline-flex items-center text-[8px] ml-1">
                <MicrophoneIcon className="h-3.5 w-3.5 mr-px" />
                {t('Recording')}
              </span>
            }
          </div>
        </div>
      </div>

      <div className="text-sm row-start-2 col-span-2 col-start-2 sm:row-start-1 sm:col-span-1 sm:col-start-3">
        <div className="text-gray-900 font-semibold flex flex-wrap">
          <Caller callerInfo={direction === 'incoming' ? from : to} />
        </div>
        <div className="text-gray-500 flex items-end flex-wrap">
          <Caller callerInfo={direction === 'incoming' ? to : from} />
          {via && 
            <span className="ml-2 text-gray-300 text-xs">{t('via')}: {via}</span>
          }
        </div>
      </div>
    </div>
  );
}