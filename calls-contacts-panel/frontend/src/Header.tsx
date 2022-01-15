import { ClipboardListIcon, PhoneIcon, UsersIcon } from '@heroicons/react/solid';
import { useCallback, useContext, useMemo } from 'react';

import { NavLink } from 'react-router-dom';
import { appContext } from './AppContext';
import { useTranslation } from 'react-i18next';

export function Header() {
  const { makeCall } = useContext(appContext);
  const { t } = useTranslation();

  const tabs = useMemo(() => {
    return [
      {
        key: 'Calls',
        name2: <span className="flex items-center"><ClipboardListIcon className="w-4 h-4 mr-1" /> {t('Calls')}</span>,
        name: t('Calls'),
        icon: <ClipboardListIcon />,
        to: '/calls',
      },
      {
        key: 'Contacts',
        name2: <span className="flex items-center"><UsersIcon className="w-4 h-4 mr-1" /> {t('Contacts')}</span>,
        name: t('Contacts'),
        icon: <UsersIcon />,
        to: '/contacts',
      }
    ];
  }, [t]);

  const openCallDialog = useCallback(() => makeCall?.(), [makeCall]);

  return (
    <div className="bg-zinc-800 h-16 3order-b border-gray-200 flex items-center pr-2 sm:pr-4">
      <h3 className="text-[11px] py-[2px] leading-[14px] tracking-[-.08em] font-medium text-gray-400 text-right -ml-2 pl-1 pr-2 h-12 w-16 bg-gray-700">
        <span>Calls &amp;</span><br/>
        <span>Contacts</span><br/>
        <span>Panel</span>
      </h3>
      <div className="ml-4">
        <nav className="flex space-x-2">
          {tabs.map((tab) => (
            <NavLink
              key={tab.key}
              to={tab.to}
              className={({ isActive }) => `
                  ${isActive
                  ? 'border-sky-600 text-gray-200'
                  : 'border-transparent bg-none'
                } whitespace-nowrap pt-1 px-2 border-b-4 font-medium text-sm h-16 flex items-center text-gray-400 hover:text-gray-200 hover:bg-zinc-900
                `}
            >
              <span className="text-sm flex flex-col items-center">
                <span className="w-4 h-4 mb-1">{tab.icon}</span>
                {tab.name}
              </span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* spacer */}
      <div className="flex-1"></div>

      <div>
        <button 
          type="button"
          onClick={openCallDialog} 
          className="inline-flex items-center justify-center w-16 h-16 border-none text-gray-200 bg-sky-800 hover:bg-sky-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <PhoneIcon className="w-6 h-6"/>
        </button>
      </div>
    </div>
  );
}
