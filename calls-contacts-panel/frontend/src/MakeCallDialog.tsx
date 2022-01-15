import { useCallback, useContext, useEffect } from 'react';

import { Dialog } from '@headlessui/react';
import { PhoneIcon } from '@heroicons/react/solid';
import { appContext } from './AppContext';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { wsApiContext } from './WsApiContext';

const PHONE_NUMBER_PATTERN = /^[+]?\d+$/;

export function MakeCallDialog() {
  const { callDialogOptions, setCallDialogOptions } = useContext(appContext);
  const { wsApi } = useContext(wsApiContext);
  const { t } = useTranslation();
  const { register, reset, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    if (callDialogOptions?.open) {
      reset({
        from: callDialogOptions?.from || wsApi?.auth.userExtension || '',
        to: callDialogOptions?.to || '',
      });
    }
  }, [callDialogOptions, reset, wsApi?.auth.userExtension]);

  const onClose = useCallback((e) => {
    setCallDialogOptions?.(cur => ({
      ...cur,
      to: undefined,
      open: false,
    }));
  }, [setCallDialogOptions])

  const onSubmit = useCallback(data => {
    setCallDialogOptions?.({
      open: false,
      to: data.to,
      from: data.from,
    });
    wsApi?.makeCall(data.from, data.to);
  }, [setCallDialogOptions, wsApi]);

  return (
    <Dialog
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center flex-col"
      open={callDialogOptions?.open || false}
      onClose={onClose}
    >
      <Dialog.Overlay className="fixed inset-0 bg-slate-900 opacity-50" />

      <div className="max-w-md p-6 my-8 overflow-hidden z-10 bg-white shadow-xl rounded-2xl">
        <Dialog.Title
          as="h3"
          className="text-lg font-medium leading-6 text-gray-900"
        >
          {t('Make Call')}
        </Dialog.Title>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-2">
          <div>
            <label htmlFor="to" className="block text-sm font-medium text-gray-700">
              {t('To')}
            </label>
            <div className="mt-1">
              <input
                {...register('to', { required: true, pattern: PHONE_NUMBER_PATTERN })}
                type="tel"
                className={`
                  placeholder:text-gray-300 shadow-sm focus:ring-sky-500 focus:border-sky-500 block w-full sm:text-sm border-gray-300 rounded-md
                  ${errors.to && 'border-red-600 bg-red-50'}
                `}
                placeholder="+49123456789"
              />
            </div>
          </div>
          <div className="mt-2">
            <label htmlFor="from" className="block text-sm font-medium text-gray-700">
              {t('From')}
            </label>
            <div className="mt-1">
              <input
                {...register('from', { required: true, pattern: PHONE_NUMBER_PATTERN })}
                type="tel"
                className={`
                  placeholder:text-gray-300 shadow-sm focus:ring-sky-500 focus:border-sky-500 block w-full sm:text-sm border-gray-300 rounded-md
                  ${errors.from && 'border-red-600 bg-red-50'}
                `}
                placeholder="123"
              />
            </div>
          </div>

          <div className="mt-4 flex items-end justify-end">
            <button
              type="button"
              className="mr-2 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-900 bg-slate-100 border border-transparent rounded-md hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-500"
              onClick={onClose}
            >
              {t('Cancel')}
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-lime-900 bg-lime-100 border border-transparent rounded-md hover:bg-lime-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-lime-500"
            >
              <PhoneIcon className="w-4 h-4 mr-1" />
              {t('Call')}
            </button>
          </div>
        </form>
      </div>
    </Dialog>
  );
}
