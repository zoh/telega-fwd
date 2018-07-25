"use strict";
/**
 * Created by zoh on 09.03.18.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDebug = process.env.DEBUG == 'true';
exports.getCfgApp = () => {
    const channels = [];
    for (let i = 0; i < 10; i++) {
        let ch = process.env['CHANNELS' + i];
        if (!ch) {
            break;
        }
        channels.push(ch.trim().replace(/'/g, ''));
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
    };
};
// db
exports.LOGGIN_STORE_DB = process.env.LOGGIN_STORE_DB || './db/logging.db';
exports.MESSAGES_STORE_DB = process.env.MESSAGES_STORE_DB || './db/messages.db';
