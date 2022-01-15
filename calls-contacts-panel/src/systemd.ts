import * as appRoot from 'app-root-path';

import { exec as cbExec, execSync } from 'child_process';
import { unlink, writeFile } from 'fs/promises';

import { getConfig } from './config';
import { promisify } from 'util';

const exec = promisify(cbExec);

const TAG = '[Service Installer]';

const serviceTemplate = `
[Unit]
Description=FreePBX realtime Calls and Contacts Panel - phonebook generation and other utils included
Documentation=https://github.com/adroste/freepbx-realtime-calls-contacts-panel
After=network.target

[Service]
Environment=NODE_ENV=production
Type=simple
User=root
WorkingDirectory=${appRoot.toString()}
ExecStart=/usr/bin/npm run start -- run-as-service
Restart=on-failure

[Install]
WantedBy=multi-user.target
`;


export async function installAsService() {
  console.log(TAG, `installing as systemd service to "${getConfig().serviceInstallFile}"`);
  await writeFile(getConfig().serviceInstallFile, serviceTemplate, 'utf-8');

  if (process.env.NODE_ENV === 'development') {
    console.log(TAG, 'skipped systemd init because app runs in development mode (NODE_ENV == "development")');
    return;
  }

  await exec('sudo systemctl daemon-reload');
  await exec('sudo systemctl stop fpbx-call-panel');
  await exec('sudo systemctl start fpbx-call-panel');
  await exec('sudo systemctl enable fpbx-call-panel');
  console.log(TAG, 'systemd service enabled and started.\nView service logs by typing: sudo journalctl -u fpbx-call-panel.service');
}

export async function uninstallService() {
  console.log(TAG, 'removing systemd service');

  try {
    if (process.env.NODE_ENV === 'development') {
      console.log(TAG, 'skipped systemd changes because app runs in development mode (NODE_ENV == "development")');
    } else {
        await exec('sudo systemctl stop fpbx-call-panel');
        await exec('sudo systemctl disable fpbx-call-panel');
    }

    await unlink(getConfig().serviceInstallFile);
    console.log(TAG, 'systemd service stopped, disabled and removed.');
  } catch (err) {
    console.log(TAG, 'error removing service, maybe the service is already stopped/removed')
  }
}

export function checkIfServiceIsRunning() {
  try {
    execSync('systemctl is-active --quiet fpbx-call-panel', { stdio: 'ignore' });
    return true; // exit code 0 => service is running;
  } catch (_) {
    return false; // other exit codes
  }
}