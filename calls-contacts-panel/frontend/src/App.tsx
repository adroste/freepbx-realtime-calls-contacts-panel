import { Navigate, Route, Routes } from 'react-router-dom';

import { CallOverview } from './CallOverview';
import { Contacts } from './Contacts';
import { CsvContactsConverter } from './CsvContactsConverter';
import { Header } from './Header';
import { LoginView } from './LoginView';
import { MakeCallDialog } from './MakeCallDialog';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { wsApiContext } from './WsApiContext';

export function App() {
  const { loggedIn, connected } = useContext(wsApiContext);
  const { t } = useTranslation();

  if (!loggedIn)
    return <LoginView />

  if (!connected)
    return (
      <div className="w-full h-full z-50 flex items-center justify-center">
        <div className="text-xl">{t('Connecting')}...</div>
      </div>
    );

  return (
    <div className="h-full max-h-full flex flex-col bg-slate-100">
      <div className="z-30 w-full flex-none">
        <Header />
      </div>
      <div className="flex-1 overflow-y-scroll">
        <Routes>
          <Route path="/calls" element={<CallOverview />} />
          <Route path="/contacts/csvconverter" element={<CsvContactsConverter />} />
          <Route path="/contacts/*" element={<Contacts />} />
          <Route path="*" element={ <Navigate replace to="/calls" /> } />
        </Routes>
      </div>
      <MakeCallDialog />
    </div>
  );
}