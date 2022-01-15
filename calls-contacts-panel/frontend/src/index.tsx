import './index.css';
import './i18n';
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/800.css';

import { App } from './App';
import { AppContextProvider } from './AppContext';
import { HashRouter } from 'react-router-dom';
import React from 'react';
import ReactDOM from 'react-dom';
import { WsApiContextProvider } from './WsApiContext';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import localizedFormat from 'dayjs/plugin/localizedFormat';

dayjs.extend(localizedFormat)
dayjs.extend(duration);

ReactDOM.render(
  <React.StrictMode>
    <WsApiContextProvider>
      <HashRouter>
        <AppContextProvider>
          <App />
        </AppContextProvider>
      </HashRouter>
    </WsApiContextProvider>
  </React.StrictMode>,
  document.getElementById('approot')
);
