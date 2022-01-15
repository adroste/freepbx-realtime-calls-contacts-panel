import * as http from 'http';

import cors from 'cors';
import express from 'express';
import { getConfig } from './config';

const TAG = '[Web Server]';
export let httpServer: http.Server;
let app: express.Express;

function promisedHttpListen(server: http.Server, port: number) {
  return new Promise((resolve, reject) => {
    server.on('listening', resolve);
    server.on('error', reject);
    server.listen(port);
  });
}

export async function startWebServer() {
  setupExpress();
  httpServer = http.createServer(app); 

  const port = getConfig().httpPort;
  await promisedHttpListen(httpServer, port);
  console.log(TAG, `HTTP server listening on port ${port}`);
}

export function getExpress() {
  return app;
}

function setupExpress() {
  app = express();
  app.use(cors({
    origin:true,
    credentials: true,
  }));
}