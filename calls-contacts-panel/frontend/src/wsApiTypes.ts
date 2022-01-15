export type IncomingOutgoing = 'incoming' | 'outgoing';

export interface CallerInfo {
  displayName?: string,
  phoneBookId?: number,
  phoneNumber?: string,
}

export interface ActiveCall {
  id: string,
  app: string, // application
  establishedAt: string,
  from: CallerInfo,
  status: string, // channelstatedesc
  to: CallerInfo,
  via: string, // channel
}

export type CallStatus = 'NO ANSWER' | 'FAILED' | 'BUSY' | 'ANSWERED' | 'UNKNOWN'; // disposition

export interface CallLog {
  id: string, // id + sequence should be unique in combination
  sequence: number,
  linkedId: string,
  linkedLogs?: CallLog[], // sorted ascending by sequence

  direction: IncomingOutgoing, // FreePBX: from-internal => outgoing (at least for CDRs)
  durationSec: number,
  from: CallerInfo,
  lastApp: string, // asterisk specific: last used dialplan app
  recording: string,
  startTime: string,
  status: CallStatus,
  to: CallerInfo,
  via?: string, // channel/did the call went through
                // like outbound_cnum for outgoing calls
                // or did for incoming calls
}

export interface CallLogsFilter {
  limit?: number,
  types?: 'all' | 'onlyCalls',
  search?: string,
}

export const PHONE_NUMBER_TYPES = ['cell', 'work', 'internal', 'home', 'other'] as const;
export const GROUP_TYPES = ['internal', 'external', 'private'] as const;

export interface PhoneNumber {
  number: string,
  type: typeof PHONE_NUMBER_TYPES[number],
  flags: ('sms' | 'fax')[],
}

export interface PhonebookEntry {
  id: number, // entryid
  uuid?: string,
  groupId: number,
  groupName: string,
  groupType: typeof GROUP_TYPES[number],
  groupOwner?: number,
  combinedName: string, // derived from displayName, firstName and lastName
  displayName?: string,
  firstName?: string,
  lastName?: string,
  company?: string,
  title?: string,
  address?: string,
  numbers?: PhoneNumber[],
  emails?: string[],
  websites?: string[],
}