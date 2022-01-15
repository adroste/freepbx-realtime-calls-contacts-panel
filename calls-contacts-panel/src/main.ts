import { installAsService, uninstallService } from './systemd';

import { Command } from 'commander';
import consoleStamp from 'console-stamp';
import { initAmi } from './api/ami';
import { initDb } from './database';
import { initHttpApi } from './api/http-api';
import { initWsApi } from './api/ws-api';
import { loadConfig } from './config';
import { monitorActiveCalls } from './func/active-calls';
import { monitorCallLogs } from './func/call-logs';
import { monitorPhonebook } from './func/phonebook';
import { startCallerId } from './func/caller-id';
import { startWebServer } from './web-server';

const banner = String.raw`
-----------------------------
Call & Contacts Panel Backend
-----------------------------
`;
console.log(banner);
// console.log(`Service 'fpbx-call-panel' is: ${checkIfServiceIsRunning() ? 'ACTIVE' : 'NOT ACTIVE'}`);
console.log('\n');

consoleStamp(console); // add timestamp to log output

function onProcError(err: unknown) {
  console.error(err);
  process.exit(2);
}
process.on('uncaughtException', onProcError);
process.on('unhandledRejection', onProcError);

function ready() {
  setTimeout(() => {
    process.send?.('ready'); // for pm2 wait_ready
  }, 1000);
}

const program = new Command();
program
  .name("npm run start --")
  .usage("[command]");

program.addHelpText('after', `
Example call:
  $ npm run start -- install`);

program
  .command('install')
  .description('Installs service (systemd)')
  .action(async () => {
    await installAsService();
  });

program
  .command('uninstall')
  .description('Stops and removes service (systemd)')
  .action(async () => {
    await uninstallService();
    // await uninstallNginxProxySnippet();
  });

program
  .command('run-as-service')
  .description('Starts the app as service')
  .action(async () => {
    console.log('running as service');
    // core
    await initDb();
    await initAmi();
    // await installNginxProxySnippet();

    // func modules
    await monitorPhonebook();
    await startCallerId();
    monitorActiveCalls();
    monitorCallLogs();

    // api
    await startWebServer();
    initHttpApi();
    initWsApi();

    ready();
  });

(async () => {
  await loadConfig();
  program.parse();
})();