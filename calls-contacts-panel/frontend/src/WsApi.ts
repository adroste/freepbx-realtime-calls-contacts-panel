import { ActiveCall, CallLog, CallLogsFilter, PhonebookEntry } from './wsApiTypes';
import { Socket, io } from 'socket.io-client';

const BACKEND_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:4848/' 
  : window.location.origin;

export const CALL_LOG_LIMIT = 1000;

export const RECV_MSG = {
  connect: 'connect',
  connectError: 'connect_error',
  disconnect: 'disconnect',

  activeCalls: 'activeCalls',
  callLogs: 'callLogs',
  phonebook: 'phonebook',
  userExtension: 'userExtension',
} as const;

export const SEND_MSG = {
  subscribeActiveCalls: 'subscribeActiveCalls',
  unsubscribeActiveCalls: 'unsubscribeActiveCalls',
  subscribeCallLogs: 'subscribeCallLogs',
  unsubscribeCallLogs: 'unsubscribeCallLogs',
  subscribePhonebook: 'subscribePhonebook',
  unsubscribePhonebook: 'unsubscribePhonebook',

  makeCall: 'makeCall',

  createPhonebookEntry: 'createPhonebookEntry',
  deletePhonebookEntry: 'deletePhonebookEntry',
  updatePhonebookEntry: 'updatePhonebookEntry',
} as const;

export class WsApi {
  socket: Socket;
  auth: { username: string, userExtension: string };
  cache: { activeCalls: ActiveCall[] };
  subscribedActiveCalls = false;
  subscribedCallLogs = false;
  subscribedPhonebook = false;

  constructor(username: string, password: string) {
    this.auth = { username, userExtension: '' };
    this.cache = { activeCalls: [] };

    this.socket = io(BACKEND_URL, {
      path: '/callpanel/socket.io',
      auth: {
        username,
        password,
      }
    });

    this.socket.on(RECV_MSG.userExtension, (extension: string) => {
      this.auth.userExtension = extension || '';
    });
  }

  close() {
    this.socket.close();
  }

  cacheActiveCalls = (activeCalls: ActiveCall[]) => {
    this.cache.activeCalls = activeCalls;
  }

  subscribeActiveCalls(listener: (activeCalls: ActiveCall[]) => void) {
    this.socket.on(RECV_MSG.activeCalls, listener);
    if (this.subscribedActiveCalls) {
      listener(this.cache.activeCalls);
    } else {
      this.socket.on(RECV_MSG.activeCalls, this.cacheActiveCalls);
      this.socket.emit(SEND_MSG.subscribeActiveCalls);
      this.subscribedActiveCalls = true;
    }
  }

  unsubscribeActiveCalls(listener: (activeCalls: ActiveCall[]) => void) {
    this.socket.off(RECV_MSG.activeCalls, listener);
    if (!this.socket.listeners(RECV_MSG.activeCalls).some(l => l !== this.cacheActiveCalls)) {
      this.socket.emit(SEND_MSG.unsubscribeActiveCalls);
      this.socket.off(RECV_MSG.activeCalls, this.cacheActiveCalls);
      this.subscribedActiveCalls = false;
    }
  }

  subscribeCallLogs(listener: (callLogs: CallLog[]) => void, filter?: CallLogsFilter) {
    this.socket.on(RECV_MSG.callLogs, listener);
    this.socket.emit(SEND_MSG.subscribeCallLogs, filter);
    this.subscribedCallLogs = true;
  }

  unsubscribeCallLogs(listener: (callLogs: CallLog[]) => void) {
    this.socket.off(RECV_MSG.callLogs, listener);
    this.socket.emit(SEND_MSG.unsubscribeCallLogs);
    this.subscribedCallLogs = false;
  }

  subscribePhonebook(listener: (phonebook: PhonebookEntry[]) => void) {
    this.socket.on(RECV_MSG.phonebook, listener);
    this.socket.emit(SEND_MSG.subscribePhonebook);
    this.subscribedPhonebook = true;
  }

  unsubscribePhonebook(listener: (phonebook: PhonebookEntry[]) => void) {
    this.socket.off(RECV_MSG.phonebook, listener);
    this.socket.emit(SEND_MSG.unsubscribePhonebook);
    this.subscribedPhonebook = false;
  }

  async createPhonebookEntry(entry: Partial<PhonebookEntry>) {
    return new Promise<number>((resolve, reject) => {
      this.socket.emit(SEND_MSG.createPhonebookEntry, entry, (id: number) => {
        if (id < 0)
          reject('create failed');
        else
          resolve(id);
      });
    })
  }

  async updatePhonebookEntry(id: number, entry: Partial<PhonebookEntry>) {
    return new Promise<void>((resolve, reject) => {
      this.socket.emit(SEND_MSG.updatePhonebookEntry, id, entry, (success: boolean) => {
        if (!success)
          reject('update failed');
        else
          resolve();
      });
    })
  }

  async deletePhonebookEntry(id: number) {
    return new Promise<void>((resolve, reject) => {
      this.socket.emit(SEND_MSG.deletePhonebookEntry, id, (success: boolean) => {
        if (!success)
          reject('delete failed');
        else
          resolve();
      });
    })
  }

  makeCall(from: string, to: string) {
    console.log('emit', from, to)
    this.socket.emit(SEND_MSG.makeCall, { from, to });
  }
}