export const AMI_ACTION_TYPES = { 
  CoreShowChannels: 'CoreShowChannels',
  Originate: 'Originate',
} as const;

// https://wiki.asterisk.org/wiki/display/AST/Asterisk+19+ManagerEvent_CoreShowChannel
export interface CoreShowChannelEvent {
  event: 'CoreShowChannel',
  actionid: string,
  channel: string,
  channelstate: string,
  channelstatedesc: string,
  calleridnum: string,
  calleridname: string,
  connectedlinenum: string,
  connectedlinename: string,
  language: string,
  accountcode: string,
  context: string,
  exten: string,
  priority: string,
  uniqueid: string,
  linkedid: string,
  application: string,
  applicationdata: string,
  duration: string,
  bridgeid: string
}