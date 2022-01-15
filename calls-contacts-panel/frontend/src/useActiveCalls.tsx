import { useContext, useEffect, useState } from 'react';

import { ActiveCall } from './wsApiTypes';
import { wsApiContext } from './WsApiContext';

export function useActiveCalls(): ActiveCall[] {
  const { wsApi } = useContext(wsApiContext);
  const [activeCalls, setActiveCalls] = useState<ActiveCall[]>([]);

  useEffect(() => {
    if (!wsApi)
      return;
    wsApi.subscribeActiveCalls(setActiveCalls);
    return () => wsApi.unsubscribeActiveCalls(setActiveCalls);
  }, [wsApi]);

  return activeCalls;
}