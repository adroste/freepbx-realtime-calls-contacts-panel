import { CallLog, CallLogsFilter } from './wsApiTypes';
import { useContext, useEffect, useState } from 'react';

import { wsApiContext } from './WsApiContext';

export function useCallLogs(filter?: CallLogsFilter): CallLog[] {
  const { wsApi } = useContext(wsApiContext);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);

  useEffect(() => {
    if (!wsApi)
      return;
    wsApi.subscribeCallLogs(setCallLogs, filter);
    return () => wsApi.unsubscribeCallLogs(setCallLogs);
  }, [filter, wsApi]);

  return callLogs;
}