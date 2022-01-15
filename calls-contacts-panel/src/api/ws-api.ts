import { ActiveCall, getActiveCalls, offActiveCallsChange, onActiveCallsChange } from '../func/active-calls';
import { CallLog, CallLogsFilter, applyCallLogsFilter, getCallLogs, offCallLogs, onCallLogs } from '../func/call-logs';
import { PhonebookEntry, createEntry, deleteEntry, getPhonebook, offPhonebookChange, onPhonebookChange, updateEntry } from '../func/phonebook';
import { checkUserModulePermissions, checkUsernamePassword, getUserExtension } from './auth';

import { Server } from 'socket.io';
import { httpServer } from '../web-server';
import { makeCall } from './makeCall';

const TAG = '[Websocket API]';

export const RECV_MSG = {
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

export const SEND_MSG = {
  activeCalls: 'activeCalls',
  callLogs: 'callLogs',
  phonebook: 'phonebook',
  userExtension: 'userExtension',
} as const;

export let io: Server;

export function initWsApi() {
  io = new Server(httpServer, {
    path: '/callpanel/socket.io',
    cors: {
      origin: true,
      credentials: true,
    }
  });
  console.log(TAG, `WS api listening...`);

  // authenticator middleware
  io.use(async (socket, next) => {
    const username = socket.handshake.auth.username || '';
    const password = socket.handshake.auth.password || '';
    if (
      await checkUsernamePassword(username, password)
      && await checkUserModulePermissions(username)
    ) {
      next(); // auth successful
    } else {
      next(new Error('authentication failed'));
      socket.disconnect();
    }
  });

  setListener();
}

function setListener() {
  io.on('connection', socket => {

    // active calls

    let subscribedActiveCalls = false;

    function sendActiveCalls(activeCalls: ActiveCall[]) {
      socket.emit(SEND_MSG.activeCalls, activeCalls);
    }

    socket.on(RECV_MSG.subscribeActiveCalls, () => {
      if (subscribedActiveCalls)
        return;
      subscribedActiveCalls = true;
      onActiveCallsChange(sendActiveCalls);
      sendActiveCalls(getActiveCalls());
    });

    socket.on(RECV_MSG.unsubscribeActiveCalls, () => {
      offActiveCallsChange(sendActiveCalls);
      subscribedActiveCalls = false;
    });


    // call logs

    let subscribedCallLogs = false;
    let callLogsFilter: CallLogsFilter | undefined;

    function sendCallLogs(callLogs: CallLog[]) {
      socket.emit(SEND_MSG.callLogs, applyCallLogsFilter(callLogs, callLogsFilter));
    }

    socket.on(RECV_MSG.subscribeCallLogs, (filter?: CallLogsFilter) => {
      if (!subscribedCallLogs)
        onCallLogs(sendCallLogs);
      subscribedCallLogs = true;
      callLogsFilter = filter;
      sendCallLogs(getCallLogs());
    });

    socket.on(RECV_MSG.unsubscribeCallLogs, () => {
      offCallLogs(sendCallLogs);
      subscribedCallLogs = false;
    });


    // phonebook

    let subscribedPhonebook = false;

    function sendPhonebook(phonebook: PhonebookEntry[]) {
      socket.emit(SEND_MSG.phonebook, phonebook);
    }

    socket.on(RECV_MSG.subscribePhonebook, () => {
      if (subscribedPhonebook)
        return;
      subscribedPhonebook = true;
      onPhonebookChange(sendPhonebook);
      sendPhonebook(getPhonebook());
    });

    socket.on(RECV_MSG.unsubscribePhonebook, () => {
      offPhonebookChange(sendPhonebook);
      subscribedPhonebook = false;
    });

    socket.on(RECV_MSG.createPhonebookEntry, async (entry?: Partial<PhonebookEntry>, cb?: (id: number) => void) => {
      const id = await createEntry(entry);
      if (typeof cb === 'function')
        cb(id);
    });

    socket.on(RECV_MSG.updatePhonebookEntry, async (id?: number, entry?: Partial<PhonebookEntry>, cb?: (success: boolean) => void) => {
      const success = await updateEntry(id, entry);
      if (typeof cb === 'function')
        cb(success);
    });

    socket.on(RECV_MSG.deletePhonebookEntry, async (id?: number, cb?: (success: boolean) => void) => {
      const success = await deleteEntry(id);
      if (typeof cb === 'function')
        cb(success);
    });
    

    // cleanup

    socket.on('disconnect', () => {
      offActiveCallsChange(sendActiveCalls);
      offCallLogs(sendCallLogs);
      offPhonebookChange(sendPhonebook);
    });


    // other

    socket.on(RECV_MSG.makeCall, ({ from, to }) => {
      makeCall(from, to);
    });


    // init code 

    (async () => {
      if (socket.handshake?.auth?.username) {
        const extension = await getUserExtension(socket.handshake.auth.username);
        socket.emit(SEND_MSG.userExtension, extension);
      }
    })();

  });
}