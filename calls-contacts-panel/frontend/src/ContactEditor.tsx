import { CheckIcon, PlusCircleIcon, ReplyIcon, UserCircleIcon, XIcon } from '@heroicons/react/solid';
import { Link, useNavigate } from 'react-router-dom';
import { PHONE_NUMBER_TYPES, PhoneNumber, PhonebookEntry } from './wsApiTypes';
import { useCallback, useContext, useEffect, useMemo } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';

import { PhonebookGroup } from './usePhonebook';
import { useTranslation } from 'react-i18next';
import { wsApiContext } from './WsApiContext';

const DEFAULT_EMAIL_FIELD = { value: '' };
const DEFAULT_WEBSITE_FIELD = { value: '' };
const DEFAULT_PHONE_NUMBER_FIELD: PhoneNumber = { flags: [], number: '', type: 'cell' };
const DEFAULT_FAX_NUMBER_FIELD: PhoneNumber = { flags: ['fax'], number: '', type: 'work' };

export function ContactEditor({ 
  entry, 
  isNew,
  groups,
  addPhoneNumber, // additional phone number
}: { 
  entry?: PhonebookEntry, 
  isNew: boolean,
  groups: PhonebookGroup[],
  addPhoneNumber?: string | null,
}) {
  const { wsApi } = useContext(wsApiContext);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const defaultValues = useMemo(() => {
    const emails = entry?.emails?.map(value => ({ value })) || [];
    emails.push(DEFAULT_EMAIL_FIELD);
    const websites = entry?.websites?.map(value => ({ value })) || [];
    websites.push(DEFAULT_WEBSITE_FIELD);
    const phoneNumbers = entry?.numbers?.filter(n => !n.flags.includes('fax')) || [];
    if (addPhoneNumber)
      phoneNumbers.push({ 
        ...DEFAULT_PHONE_NUMBER_FIELD,
        number: addPhoneNumber,
      });
    phoneNumbers.push(DEFAULT_PHONE_NUMBER_FIELD);
    const faxNumbers = entry?.numbers?.filter(n => n.flags.includes('fax')) || [];
    faxNumbers.push(DEFAULT_FAX_NUMBER_FIELD);

    return {
      groupId: entry?.groupId?.toString() || '',
      firstName: entry?.firstName || '',
      lastName: entry?.lastName || '',
      displayName: entry?.displayName || '',
      title: entry?.title || '',
      company: entry?.company || '',
      address: entry?.address || '',
      emails,
      websites,
      phoneNumbers,
      faxNumbers,
    };
  }, [addPhoneNumber, entry]);

  const { control, register, reset, handleSubmit, watch, formState: { errors } } = useForm({ defaultValues });
  const { fields: emailFields, append: _appendEmailField } = useFieldArray({ control, name: "emails" });
  const { fields: websiteFields, append: _appendWebsiteField } = useFieldArray({ control, name: "websites" });
  const { fields: phoneNumberFields, append: _appendPhoneNumberField } = useFieldArray({ control, name: "phoneNumbers" });
  const { fields: faxNumberFields, append: _appendFaxNumberField } = useFieldArray({ control, name: "faxNumbers" });

  const onReset = useCallback(() => reset(), [reset]);

  const onSubmit = useCallback((v: typeof defaultValues) => {
    const final: Partial<PhonebookEntry> = {
      ...entry,
      groupId: parseInt(v.groupId),
      firstName: v.firstName.trim(),
      lastName: v.lastName.trim(),
      displayName: v.displayName.trim(),
      title: v.title.trim(),
      company: v.company.trim(),
      address: v.address.trim(),
      emails: v.emails.map(e => e.value).filter(x => x),
      websites: v.websites.map(w => w.value).filter(x => x),
      numbers: [ ...v.phoneNumbers, ...v.faxNumbers ].filter(nr => nr.number),
    };
    if (isNew) {
      wsApi?.createPhonebookEntry(final)
        .then((id) => navigate(`/contacts/${id}`))
        .catch(() => alert('ERROR create contact failed'))
    } else if (entry?.id) {
      wsApi?.updatePhonebookEntry(entry.id, final)
        .then(() => navigate(`/contacts/${entry.id}`))
        .catch(() => alert('ERROR update contact failed'))
    }
  }, [entry, isNew, navigate, wsApi]);

  const appendEmailField = useCallback(() =>
    _appendEmailField(DEFAULT_EMAIL_FIELD, { shouldFocus: false }), [_appendEmailField]);

  const appendWebsiteField = useCallback(() =>
    _appendWebsiteField(DEFAULT_WEBSITE_FIELD, { shouldFocus: false }), [_appendWebsiteField]);

  const appendPhoneNumberField = useCallback(() =>
    _appendPhoneNumberField(DEFAULT_PHONE_NUMBER_FIELD, { shouldFocus: false }), [_appendPhoneNumberField]);

  const appendFaxNumberField = useCallback(() =>
    _appendFaxNumberField(DEFAULT_FAX_NUMBER_FIELD, { shouldFocus: false }), [_appendFaxNumberField]);

  useEffect(() => {
    const sub = watch(fields => {
      if (fields.emails?.every(v => !!v?.value))
        appendEmailField();
      if (fields.websites?.every(v => !!v?.value))
        appendWebsiteField();
      if (fields.phoneNumbers?.every(v => !!v?.number))
        appendPhoneNumberField();
      if (fields.faxNumbers?.every(v => !!v?.number))
        appendFaxNumberField();
    });
    return () => sub.unsubscribe();
  }, [appendEmailField, appendFaxNumberField, appendPhoneNumberField, appendWebsiteField, watch]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="absolute inset-0 flex flex-col bg-white z-10">

      <header className="relative w-full bg-gray-50 py-1 px-1 flex items-center gap-2">
        <Link
          to={entry?.id ? `/contacts/${entry.id}` : '/contacts'}
          className="inline-flex items-center justify-center px-2 py-1 text-sm rounded-sm text-slate-900 bg-slate-100 border border-transparent hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-500"
        >
          <XIcon className="w-4 h-4 mr-1" />
          {t('Cancel')}
        </Link>
        <span className="flex-1"></span>
        <button
          type="button"
          className="inline-flex items-center justify-center px-2 py-1 text-sm rounded-sm text-slate-900 bg-slate-100 border border-transparent hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-500"
          onClick={onReset}
        >
          <ReplyIcon className="w-4 h-4 mr-1" />
          {t('Reset')}
        </button>
        <button
          type="submit"
          className="inline-flex items-center justify-center px-2 py-1 text-sm rounded-sm text-sky-900 bg-sky-100 border border-transparent hover:bg-sky-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500"
        >
          <CheckIcon className="w-4 h-4 mr-1" />
          {t('Save')}
        </button>
      </header>

      <div className="flex-1 overflow-y-scroll">
        <div className="flex items-center justify-center">
          <div className="relative max-w-3xl flex-1 px-4 py-5">
            <div className="text-lg flex items-center font-medium leading-6 text-gray-900">
              <UserCircleIcon className="w-8 h-8 pb-px mr-3 text-slate-400" />
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {isNew ? t('New Contact') : t('Edit Contact')}
              </h3>
            </div>

            <hr className="my-4" />

            <div className="grid grid-cols-1 gap-y-4 gap-x-10 sm:grid-cols-2 md:grid-cols-3">
              <div className="sm:col-span-1">
                <div className="text-sm font-medium text-gray-500">{t('c.firstName')}</div>
                <input {...register('firstName')} type="text"
                  className="mt-1 w-full text-gray-900 rounded-sm text-sm focus:ring-sky-500 focus:border-sky-500 border-gray-300"
                />
              </div>
              <div className="sm:col-span-1">
                <div className="text-sm font-medium text-gray-500">{t('c.lastName')}</div>
                <input {...register('lastName')} type="text"
                  className="mt-1 w-full text-gray-900 rounded-sm text-sm focus:ring-sky-500 focus:border-sky-500 border-gray-300"
                />
              </div>
              <div className="sm:col-span-1">
                <div className="text-sm font-medium text-gray-500">{t('c.displayName')}</div>
                <input {...register('displayName')} type="text"
                  className="mt-1 w-full text-gray-900 rounded-sm text-sm focus:ring-sky-500 focus:border-sky-500 border-gray-300"
                />
              </div>
              <div className="sm:col-span-1">
                <div className="text-sm font-medium text-gray-500">{t('c.title')}</div>
                <input {...register('title')} type="text"
                  className="mt-1 w-full text-gray-900 rounded-sm text-sm focus:ring-sky-500 focus:border-sky-500 border-gray-300"
                />
              </div>
              <div className="sm:col-span-1">
                <div className="text-sm font-medium text-gray-500">{t('c.company')}</div>
                <input {...register('company')} type="text"
                  className="mt-1 w-full text-gray-900 rounded-sm text-sm focus:ring-sky-500 focus:border-sky-500 border-gray-300"
                />
              </div>
              <div className="sm:col-span-1">
                <div className="text-sm font-medium text-gray-500">{t('c.address')}</div>
                <textarea {...register('address')} rows={3}
                  className="mt-1 w-full text-gray-900 rounded-sm text-sm focus:ring-sky-500 focus:border-sky-500 border-gray-300"
                ></textarea>
              </div>
              <div className="sm:col-span-1">
                <div className="text-sm font-medium text-gray-500 flex">
                  {t('c.email')}
                  <button
                    type="button"
                    className="ml-1 w-5 h-5 bg-white inline-flex items-center justify-center text-gray-400 rounded-full bg-transparent hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
                    onClick={appendEmailField}
                  >
                    <PlusCircleIcon className="w-5 h-5" />
                  </button>
                </div>
                {emailFields.map((field, index) => (
                  <div key={field.id} className="mt-1 text-sm text-gray-900">
                    <input {...register(`emails.${index}.value`)} type="email"
                      className="w-full text-gray-900 rounded-sm text-sm focus:ring-sky-500 focus:border-sky-500 border-gray-300"
                    />
                  </div>
                ))}
              </div>
              <div className="sm:col-span-1">
                <div className="text-sm font-medium text-gray-500 flex">
                  {t('c.website')}
                  <button
                    type="button"
                    className="ml-1 w-5 h-5 bg-white inline-flex items-center justify-center text-gray-400 rounded-full bg-transparent hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
                    onClick={appendWebsiteField}
                  >
                    <PlusCircleIcon className="w-5 h-5" />
                  </button>
                </div>
                {websiteFields.map((field, index) => (
                  <div key={field.id} className="mt-1 text-sm text-gray-900">
                    <input {...register(`websites.${index}.value`)} type="text"
                      className="w-full text-gray-900 rounded-sm text-sm focus:ring-sky-500 focus:border-sky-500 border-gray-300"
                    />
                  </div>
                ))}
              </div>
              <div className="sm:col-span-1">
                <div className="text-sm font-medium text-gray-500">{t('c.group')}</div>
                <select {...register('groupId', { required: true })}
                  className={`
                  mt-1 w-full text-gray-900 rounded-sm text-sm focus:ring-sky-500 focus:border-sky-500 border-gray-300
                    ${errors.groupId && 'border-red-600 bg-red-50'}
                  `}
                >
                  <option disabled value={''}>---</option>
                  {groups.filter(g => g.type !== 'internal').map(group =>
                    <option key={group.id} value={group.id}>{group.name} ({t('grouptype.'+group.type)})</option>
                  )}
                </select>
              </div>
              <div className="sm:col-start-1 sm:col-end-3">
                <div className="text-sm font-medium text-gray-500 flex">
                  {t('c.phoneNumber')}
                  <button
                    type="button"
                    className="ml-1 w-5 h-5 bg-white inline-flex items-center justify-center text-gray-400 rounded-full bg-transparent hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
                    onClick={appendPhoneNumberField}
                  >
                    <PlusCircleIcon className="w-5 h-5" />
                  </button>
                </div>
                {phoneNumberFields.map((field, index) => (
                  <div key={field.id} className="mt-1 text-sm text-gray-900 flex space-x-2 items-center">
                    <select {...register(`phoneNumbers.${index}.type`)}
                      className="text-gray-900 rounded-sm text-sm focus:ring-sky-500 focus:border-sky-500 border-gray-300"
                    >
                      {PHONE_NUMBER_TYPES.filter(t => t !== 'internal').map(type =>
                        <option key={type} value={type}>{t('numbertype.' + type)}</option>
                      )}
                    </select>
                    <input {...register(`phoneNumbers.${index}.number`, { required: index === 0 })} type="tel"
                      className={`
                        flex-1 text-gray-900 rounded-sm text-sm focus:ring-sky-500 focus:border-sky-500 border-gray-300
                        ${index === 0 && errors.phoneNumbers?.[0].number && 'border-red-600 bg-red-50'}
                        ${addPhoneNumber && field.number === addPhoneNumber && 'border-green-600 bg-green-50'}
                      `}
                    />
                  </div>
                ))}
              </div>
              <div className="sm:col-start-1 sm:col-end-3">
                <div className="text-sm font-medium text-gray-500 flex">
                  {t('c.fax')}
                  <button
                    type="button"
                    className="ml-1 w-5 h-5 bg-white inline-flex items-center justify-center text-gray-400 rounded-full bg-transparent hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
                    onClick={appendFaxNumberField}
                  >
                    <PlusCircleIcon className="w-5 h-5" />
                  </button>
                </div>
                {faxNumberFields.map((field, index) => (
                  <div key={field.id} className="mt-1 text-sm text-gray-900 flex space-x-2 items-center">
                    <select {...register(`faxNumbers.${index}.type`)}
                      className="text-gray-900 rounded-sm text-sm focus:ring-sky-500 focus:border-sky-500 border-gray-300"
                    >
                      {PHONE_NUMBER_TYPES.filter(t => t !== 'internal').map(type =>
                        <option key={type} value={type}>{t('numbertype.' + type)}</option>
                      )}
                    </select>
                    <input {...register(`faxNumbers.${index}.number`)} type="tel"
                      className="flex-1 text-gray-900 rounded-sm text-sm focus:ring-sky-500 focus:border-sky-500 border-gray-300"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
