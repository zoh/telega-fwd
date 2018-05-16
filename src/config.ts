/**
 * Created by zoh on 09.03.18.
 */


export type CfgApp = {
  phoneNumber: string;
  apiID: number;
  apiHash: string;

  storagePath: string; // './storage/storage.json';

  dev: boolean;

  channels: string[];

  channel_target: string;
}


export const isDebug = process.env.DEBUG == 'true';

export const getCfgApp = (): CfgApp => {
  const channels = [];

  for (let i = 0; i < 10; i++) {
    let ch = process.env['CHANNELS' + i];
    if (!ch) {
      break;
    }
    channels.push(ch.trim())
  }

  console.log('All channels for subscribe', channels);

  const channel_target = process.env.CHANNEL_TARGET;
  if (!channel_target) {
    throw 'CHANNEL_TARGET need set in environment';
  }

  console.log('channel_target:', channel_target);

  return {
    phoneNumber: process.env.PHONE_NUMBER,
    apiID: Number(process.env.API_ID),
    apiHash: process.env.API_HASH,
    storagePath: process.env.STORAGE_PATH,
    dev: false,
    channels,
    channel_target,
  }
};


export type CfgApi = {
  layer: number;
  initConnection: number;
  api_id: number;
}

export const getCfgApi = (): CfgApi => {
  return {
    layer: 57,
    initConnection: 0x69796de9,
    api_id: Number(process.env.API_ID),
  }
};


// db
export const LOGGIN_STORE_DB = process.env.LOGGIN_STORE_DB || './db/logging.db';
export const MESSAGES_STORE_DB = process.env.MESSAGES_STORE_DB || './db/messages.db';