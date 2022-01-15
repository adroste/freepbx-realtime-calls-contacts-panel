import { FormEvent, useCallback, useContext } from 'react';

import { useTranslation } from 'react-i18next';
import { wsApiContext } from './WsApiContext';

export function LoginView() {
  const { login, connectError } = useContext(wsApiContext);
  const { t } = useTranslation();

  const onSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const target = event.target as HTMLFormElement;
    const username = target.username.value;
    const password = target.password.value;
    if (username && password)
      await login?.(username, password);
  }, [login]);

  return (
    <div className="min-h-full flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          <span className="text-sm">FreePBX Calls &amp; Contacts Panel</span><br/>{t('Login')}
        </h2>
        <p className="mt-4 text-xs text-center text text-gray-600">
          {t('LoginAccessHint')} 
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={onSubmit}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                {t('Username')}
              </label>
              <div className="mt-1">
                <input id="username" name="username" type="username" autoComplete="username" required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {t('Password')}
              </label>
              <div className="mt-1">
                <input id="password" name="password" type="password" autoComplete="current-password" required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500">
                {t('Login')}
              </button>
              {connectError &&
                <p className="mt-2 text-center text text-red-600">
                  {t('Login not successful')} <br/>
                  <span className="text-xs">(Error: "{connectError}")</span>
                </p>
              }
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}