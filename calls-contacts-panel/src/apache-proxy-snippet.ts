// import { stat, unlink, writeFile } from 'fs/promises';

// import { exec as cbExec } from 'child_process';
// import { getConfig } from './config';
// import { promisify } from 'util';

// const exec = promisify(cbExec);

// const TAG = '[Apache Proxy Snippet Installer]';

// const proxySnippetTemplate = (httpPort: number) => `
// RewriteEngine On

// RewriteCond %{REQUEST_URI}  ^/callpanel [NC]
// RewriteCond %{QUERY_STRING} transport=websocket [NC]
// RewriteRule ^(.*)$ ws://localhost:${httpPort}$1 [P,L]

// RewriteCond %{REQUEST_URI}  ^/callpanel [NC]
// RewriteRule ^(.*)$ http://localhost:${httpPort}$1 [P,L]
// `;

// export async function installApacheProxySnippet() {
//   throw new Error('not implemented');
//   if (await stat(getConfig().nginxProxySnippetInstallFile).then(() => true, () => false)) {
//     console.log(TAG, `nginx proxy snippet already installed, skipping install`);
//     return;
//   }
    
//   await writeFile(getConfig().nginxProxySnippetInstallFile, proxySnippetTemplate(getConfig().httpPort), 'utf-8');
//   console.log(TAG, `installed nginx proxy snippet to "${getConfig().nginxProxySnippetInstallFile}"`);

//   if (process.env.NODE_ENV === 'development') {
//     console.log(TAG, 'skipped systemd nginx reload because app runs in development mode (NODE_ENV == "development")');
//     return;
//   }

//   await exec('sudo systemctl restart nginx');
//   console.log(TAG, 'reloaded service nginx');
// }

// export async function uninstallNginxProxySnippet() {
//   throw new Error('not implemented');
//   console.log(TAG, `removing nginx proxy snippet from "${getConfig().nginxProxySnippetInstallFile}"`);

//   try {
//     await unlink(getConfig().nginxProxySnippetInstallFile);
//   } catch (err) {
//     console.log(TAG, 'error removing nginx proxy snippet, maybe it is already removed')
//   }

//   if (process.env.NODE_ENV === 'development') {
//     console.log(TAG, 'skipped systemd nginx reload because app runs in development mode (NODE_ENV == "development")');
//     return;
//   }

//   await exec('sudo systemctl restart nginx');
//   console.log(TAG, 'reloaded service nginx');
// }