import { ReactNode, createContext, useCallback, useEffect, useMemo, useState } from 'react';

import { WsApi } from './WsApi';

export interface WsApiContext {
  wsApi?: WsApi,
  connected: boolean,
  connectError: string | null,
  loggedIn: boolean,
  login?: (username: string, password: string) => void,
}

export const wsApiContext = createContext<WsApiContext>({
  connected: false,
  connectError: null,
  loggedIn: false,
});

export function WsApiContextProvider({ children }: { children: ReactNode }) {
  const [wsApi, setWsApi] = useState<WsApi>();
  const [connected, setConnected] = useState<boolean>(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState<boolean>(false);

  const login = useCallback((username: string, password: string) => {
    setConnectError(null);
    const wsApi = new WsApi(username, password);

    wsApi.socket.on('connect', () => {
      setConnected(true);

      // save login infos
      setLoggedIn(true);
      localStorage.setItem('api-login-user', username);
      localStorage.setItem('api-login-pw', password);
    });

    wsApi.socket.on('connect_error', (err) => {
      setConnected(false);
      setConnectError(err.message);

      // remove login infos
      if (err.message.includes('auth')) {
        setLoggedIn(false);
        localStorage.removeItem('api-login-user');
        localStorage.removeItem('api-login-pw');
      }
    });

    wsApi.socket.on('disconnect', () => {
      setConnected(false);
    });

    setWsApi(wsApi);
  }, []);

  // auto-login
  useEffect(() => {
    if (wsApi)
      return;
    const username = localStorage.getItem('api-login-user');
    const password = localStorage.getItem('api-login-pw');
    if (username && password)
      login(username, password);
  }, [login, wsApi]);

  const context = useMemo(() => ({
    wsApi,
    connected,
    connectError,
    login,
    loggedIn,
  }), [connectError, connected, loggedIn, login, wsApi]);

  return (
    <wsApiContext.Provider value={context}>
      {children}
    </wsApiContext.Provider>
  );
}