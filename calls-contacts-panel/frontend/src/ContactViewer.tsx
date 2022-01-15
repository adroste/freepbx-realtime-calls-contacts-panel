import { ArrowLeftIcon, ExclamationIcon, PencilAltIcon, PhoneIcon, TrashIcon, UserCircleIcon } from '@heroicons/react/solid';
import { Link, useNavigate } from 'react-router-dom';
import { MouseEvent, useCallback, useContext, useState } from 'react';

import { Dialog } from '@headlessui/react';
import { NumberTypeIcon } from './NumberTypeIcon';
import { PhonebookEntry } from './wsApiTypes';
import { appContext } from './AppContext';
import { useTranslation } from 'react-i18next';
import { wsApiContext } from './WsApiContext';

export function ContactViewer({ entry }: { entry: PhonebookEntry }) {
  const { wsApi } = useContext(wsApiContext);
  const { makeCall } = useContext(appContext);
  const { t } = useTranslation();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const navigate = useNavigate();
  const e = entry;

  const onCallClick = useCallback((e: MouseEvent<HTMLElement>) => {
    makeCall?.(e.currentTarget.dataset.number);
  }, [makeCall]);

  const onDeleteClick = useCallback(() => setDeleteConfirmOpen(true), []);
  const cancelDelete = useCallback(() => setDeleteConfirmOpen(false), []);
  const confirmDelete = useCallback(() => {
    setDeleteConfirmOpen(false);
    wsApi?.deletePhonebookEntry(entry.id)
      .then(() => navigate('/contacts'))
      .catch(() => alert('ERROR delete contact failed'))
  }, [entry.id, navigate, wsApi]);

  const phoneNumbers = e.numbers?.filter(n => !n.flags.includes('fax')) || [];
  const faxNumbers = e.numbers?.filter(n => n.flags.includes('fax')) || [];

  return (
    <div className="absolute inset-0 flex flex-col bg-white z-10">

      <header className="relative w-full bg-gray-50 py-1 px-1 flex items-center gap-2">
        <Link
          to="/contacts"
          className="inline-flex items-center justify-center px-2 py-1 text-sm rounded-sm text-slate-900 bg-slate-100 border border-transparent hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-500"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1" />
          {t('Contacts')}
        </Link>
        <span className="flex-1"></span>
        {entry.groupType !== 'internal' &&
          <>
            <button
              type="button"
              className="inline-flex items-center justify-center px-2 py-1 text-sm rounded-sm text-red-900 bg-red-100 border border-transparent hover:bg-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500"
              onClick={onDeleteClick}
            >
              <TrashIcon className="w-4 h-4 mr-1" />
              {t('Delete')}
            </button>
            <Link
              to={`/contacts/${entry.id}/edit`}
              className="inline-flex items-center justify-center px-2 py-1 text-sm rounded-sm text-sky-900 bg-sky-100 border border-transparent hover:bg-sky-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500"
            >
              <PencilAltIcon className="w-4 h-4 mr-1" />
              {t('Edit')}
            </Link>
          </>
        }
      </header>

      <div className="flex-1 overflow-y-scroll">
        <div className="flex items-center justify-center">
          <div className="relative max-w-3xl flex-1 px-4 py-5">
            <div className="text-lg flex items-center font-medium leading-6 text-gray-900">
              <UserCircleIcon className="w-8 h-8 pb-px mr-3 text-slate-400" />
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">{e.combinedName}</h3>
                <p className="text-xs text-gray-500">{t('c.group')}: {e.groupName}</p>
              </div>
            </div>

            <hr className="my-4" />

            <dl className="grid grid-cols-1 gap-y-4 gap-x-10 sm:grid-cols-2 md:grid-cols-3">
              {e.firstName &&
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">{t('c.firstName')}</dt>
                  <dd className="mt-1 text-sm text-gray-900">{e.firstName}</dd>
                </div>
              }
              {e.lastName &&
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">{t('c.lastName')}</dt>
                  <dd className="mt-1 text-sm text-gray-900">{e.lastName}</dd>
                </div>
              }
              {e.displayName &&
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">{t('c.displayName')}</dt>
                  <dd className="mt-1 text-sm text-gray-900">{e.displayName}</dd>
                </div>
              }
              {e.title &&
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">{t('c.title')}</dt>
                  <dd className="mt-1 text-sm text-gray-900">{e.title}</dd>
                </div>
              }
              {e.company &&
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">{t('c.company')}</dt>
                  <dd className="mt-1 text-sm text-gray-900">{e.company}</dd>
                </div>
              }
              {e.address &&
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">{t('c.address')}</dt>
                  <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{e.address}</dd>
                </div>
              }
              {!!e.emails?.length &&
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">{t('c.email')}</dt>
                  {e.emails.map((email, i) => (
                    <dd key={`${email}_${i}`} className="mt-1 text-sm text-gray-900">
                      <a href={`mailto:${email}`}>{email}</a>
                    </dd>
                  ))}
                </div>
              }
              {!!e.websites?.length &&
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">{t('c.website')}</dt>
                  {e.websites.map((website, i) => {
                    let link = website;
                    if (!link.startsWith('http'))
                      link = 'http://' + link;
                    return (
                      <dd key={`${website}_${i}`} className="mt-1 text-sm text-gray-900">
                        <a href={link} target="_blank" rel="noreferrer">{website}</a>
                      </dd>
                    );
                  })}
                </div>
              }
              {!!phoneNumbers.length &&
                <div className="sm:col-start-1 sm:col-end-3">
                  <dt className="text-sm font-medium text-gray-500">{t('c.phoneNumber')}</dt>
                  {phoneNumbers.map((nr, i) => (
                    <dd key={`${nr.number}_${i}`} className="mt-1 h-8 text-sm text-gray-900 flex items-center">
                      <div className="w-4 h-4 text-slate-700"><NumberTypeIcon type={nr.type} /></div>
                      <div className="ml-1 w-36">{t('numbertype.' + nr.type)}</div>
                      <div>{nr.number}</div>
                      <button
                        className="ml-1 w-8 h-8 bg-white inline-flex items-center justify-center text-gray-400 rounded-full bg-transparent hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
                        onClick={onCallClick}
                        data-number={nr.number}
                      >
                        <PhoneIcon className="w-5 h-5" aria-hidden="true" />
                      </button>
                    </dd>
                  ))}
                </div>
              }
              {!!faxNumbers.length &&
                <div className="sm:col-start-1 sm:col-end-3">
                  <dt className="text-sm font-medium text-gray-500">{t('c.fax')}</dt>
                  {faxNumbers.map((nr, i) => (
                    <dd key={`${nr.number}_${i}`} className="mt-1 h-8 text-sm text-gray-900 flex items-center">
                      <div className="w-4 h-4 text-slate-700"><NumberTypeIcon type={nr.type} /></div>
                      <div className="ml-1 w-36">{t('numbertype.' + nr.type)}</div>
                      <div>{nr.number}</div>
                    </dd>
                  ))}
                </div>
              }
            </dl>
          </div>
        </div>
      </div>

      <Dialog
        as="div"
        className="fixed z-10 inset-0 overflow-y-auto"
        open={deleteConfirmOpen}
        onClose={cancelDelete}
      >
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <Dialog.Overlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

          {/* This element is to trick the browser into centering the modal contents. */}
          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
            &#8203;
          </span>
          <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <ExclamationIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <Dialog.Title as="h3" className="text-lg leading-6 font-medium text-gray-900">
                  {t('removeContact.title')}
                </Dialog.Title>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    {t('removeContact.description')}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 sm:mt-0 sm:w-auto sm:text-sm"
                onClick={cancelDelete}
              >
                {t('Cancel')}
              </button>
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={confirmDelete}
              >
                {t('Delete')}
              </button>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
