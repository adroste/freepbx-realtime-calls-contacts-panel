import { PhoneIcon, PlusIcon } from '@heroicons/react/solid';
import React, { MouseEventHandler, ReactNode, useContext, useMemo } from 'react';

import { Link } from 'react-router-dom';
import { Menu } from '@headlessui/react';
import { NumberTypeIcon } from './NumberTypeIcon';
import { PhonebookEntry } from './wsApiTypes';
import { appContext } from './AppContext';

export const ContactCard = React.memo(({
  entry,
  addPhoneNumber, // (if set) mode: change icon and redirect to edit page on click
}: {
  entry: PhonebookEntry,
  addPhoneNumber?: string | null,
}) => {
  const { makeCall } = useContext(appContext);

  const actions: Array<{ icon: ReactNode, title: string, onClick: MouseEventHandler }> = useMemo(() => {
    return entry.numbers?.map(nr => ({
      icon: <NumberTypeIcon type={(nr.type)} />,
      title: nr.number,
      onClick: (e) => {
        e.preventDefault();
        e.stopPropagation();
        makeCall?.(nr.number);
      }
    })) || [];
  }, [entry.numbers, makeCall]);

  return (
    <Link
      className={`
        relative h-14 flex-1 flex items-center justify-between 
        border border-gray-200 bg-white rounded-md shadow-sm 
        cursor-pointer hover:border-sky-500 focus:ring-sky-500 focus:ring-1 focus:border-sky-500 outline-none
      `}
      to={addPhoneNumber ? `/contacts/${entry.id}/edit?phonenumber=${addPhoneNumber}` : `/contacts/${entry.id}`}
    >
      <div className="flex-1 px-4 text-sm truncate">
        <p className="text-gray-900 font-medium">
          {entry.combinedName}
        </p>
        <p className="text-gray-500 truncate">
          {entry.numbers?.map(n => n.number).join(', ')}
        </p>
      </div>
      <div className="flex-shrink-0 pr-2">
        {addPhoneNumber ?
          (
            <button
              type="button"
              className="w-8 h-8 bg-white inline-flex items-center justify-center text-gray-400 rounded-full bg-transparent hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
            >
              <PlusIcon className="w-5 h-5" aria-hidden="true" />
            </button>
          ) : (
            <Menu>
              <Menu.Button
                className="w-8 h-8 bg-white inline-flex items-center justify-center text-gray-400 rounded-full bg-transparent hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
              >
                <PhoneIcon className="w-5 h-5" aria-hidden="true" />
              </Menu.Button>

              <Menu.Items className="absolute right-0 max-w-full mt-1 origin-top-right z-40 bg-white rounded-md shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="px-1 py-1 ">
                  {actions.map(({ icon, title, onClick }) => (
                    <Menu.Item key={title}>
                      {({ active }) => (
                        <button
                          className={`${active ? 'bg-sky-600 text-white' : 'text-gray-900'
                            } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                          onClick={onClick}
                        >
                          <span className="w-4 h-4 mr-2 text-slate-600">{icon}</span>
                          {title}
                        </button>
                      )}
                    </Menu.Item>
                  ))}
                </div>
              </Menu.Items>
            </Menu>
          )
        }
      </div>
    </Link>
  );
});