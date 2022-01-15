import { getConfig, loadConfig } from '../config';

import { Manager } from 'socket.io-client';
import { initWsApi } from './ws-api';
import { startWebServer } from '../web-server';

function getRandomInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}

const httpPort = getRandomInt(20000, 30000);

beforeAll(async () => {
  await loadConfig();
  getConfig().httpPort = httpPort; // overwrite port
  await startWebServer();
  initWsApi();
})

describe('ws-api', () => {
  it('ws connection from a client', () => {
    expect.assertions(1);
    const io = new Manager(`ws://localhost:${httpPort}`, { 
      autoConnect: false, 
      path: '/callpanel/socket.io',
    });
    return new Promise(resolve => {
      io.connect(err => {
        expect(err).toBeUndefined();
        resolve(undefined);
      });
    })
  });
});