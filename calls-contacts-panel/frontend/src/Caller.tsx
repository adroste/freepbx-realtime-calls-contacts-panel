import { ChevronDownIcon, IdentificationIcon, PhoneIcon, PlusIcon, UserAddIcon } from '@heroicons/react/solid';
import { MouseEventHandler, ReactNode, useContext, useMemo } from 'react';

import { CallerInfo } from './wsApiTypes';
import { Menu } from '@headlessui/react';
import { appContext } from './AppContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function Caller({ callerInfo }: { callerInfo: CallerInfo }) {
  const { makeCall } = useContext(appContext);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { displayName, phoneNumber, phoneBookId } = callerInfo;

  const actions: Array<{ icon: ReactNode, title: string, onClick: MouseEventHandler }> = useMemo(() => {
    const actions = [];
    if (phoneNumber) {
      actions.push({
        icon: <PhoneIcon />,
        title: t('Make Call'),
        onClick: () => { makeCall?.(phoneNumber) }
      });
      if (phoneBookId) {
        actions.push({
          icon: <IdentificationIcon />,
          title: t('Show Contact'),
          onClick: () => { navigate(`/contacts/${phoneBookId}`) }
        });
      } else {
        actions.push({
          icon: <PlusIcon />,
          title: t('New Contact'),
          onClick: () => { navigate(`/contacts/new?phonenumber=${phoneNumber}`) }
        });
        actions.push({
          icon: <UserAddIcon />,
          title: t('Add to Existing Contact'),
          onClick: () => { navigate(`/contacts?phonenumber=${phoneNumber}`) }
        });
      }
    }
    return actions;
  }, [makeCall, navigate, phoneBookId, phoneNumber, t]);

  const hasActions = actions.length > 0;

  return (
    <Menu as="span" className="relative">
      <Menu.Button
        disabled={!hasActions}
        className={`
          whitespace-pre-wrap inline-flex flex-wrap items-center rounded-md -mx-1 px-1
          ${hasActions && 'curso@r-pointer hover:bg-slate-200'}
        `}
      >
        <span className="inline-block">
          {displayName || phoneNumber || t('Unknown')}
        </span>
        {displayName && phoneNumber && phoneNumber !== displayName &&
          <span className="inline-block ml-1 first:ml-0">({phoneNumber})</span>
        }
        {hasActions &&
          <ChevronDownIcon className="h-3 w-3" />
        }
      </Menu.Button>

      <Menu.Items className="absolute left-0 w-56 mt-2 origin-top-right z-40 bg-white rounded-md shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none">
        <div className="px-1 py-1 ">
          {actions.map(({ icon, title, onClick }) => (
            <Menu.Item key={title}>
              {({ active }) => (
                <button
                  className={`${active ? 'bg-sky-600 text-white' : 'text-gray-900'
                    } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                  onClick={onClick}
                >
                  <span className="w-4 h-4 mr-2">{icon}</span>
                  {title}
                </button>
              )}
            </Menu.Item>
          ))}
        </div>
      </Menu.Items>
    </Menu>
  );
}