import { ReactNode, createContext, useCallback, useMemo, useState } from 'react';

export interface CallDialogOptions {
  open?: boolean, 
  from?: string, 
  to?: string,
}

export interface AppContext {
  callDialogOptions?: CallDialogOptions,
  setCallDialogOptions?: (callDialogOptions: (CallDialogOptions | ((currentOptions: CallDialogOptions) => CallDialogOptions))) => void,
  makeCall?: (to?: string) => void,
}

export const appContext = createContext<AppContext>({});

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [callDialogOptions, setCallDialogOptions] = useState<CallDialogOptions>({});

  const makeCall = useCallback((to?: string) => {
    setCallDialogOptions(cur => ({ ...cur, to, open: true }));
  }, []);

  const context = useMemo(() => ({
    callDialogOptions,
    setCallDialogOptions,
    makeCall,
  }), [callDialogOptions, makeCall]);

  return (
    <appContext.Provider value={context}>
      {children}
    </appContext.Provider>
  );
}