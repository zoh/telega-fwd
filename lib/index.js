"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const tgram_client_1 = require("./tgram/tgram-client");
const _ = require("lodash");
const logger_1 = require("./logger");
const root_1 = require("./store/root");
const utils_1 = require("./utils");
const cluster = require("cluster");
const config = config_1.getCfgApp();
const api = config_1.getCfgApi();
if (cluster.isMaster) {
    cluster.fork();
    cluster.on('exit', (worker, code, signal) => {
        console.log(`worker ${worker.process.pid} died`, code, signal);
        if (code > 0) {
            cluster.fork();
        }
    });
}
else {
    let wasConnected = false;
    // n minute time out
    setTimeout(() => {
        if (wasConnected == false) {
            throw 'Too later didn\'t connected.';
        }
    }, 2 * 60 * 1000);
    (async function () {
        const tgClient = new tgram_client_1.TgramClient(config, api, root_1.default.messagesStore);
        // 5sec timeout
        await utils_1.timeout(2000);
        await tgClient.init();
        await utils_1.timeout(2000);
        // находим id каналов нам нужно подписаться
        let d = await tgClient.getDialogs();
        if (config_1.isDebug) {
            console.log('Show all channels');
            for (let c of d.chats) {
                console.log(c.id, c.title);
            }
        }
        let chats = _.filter(d.chats, ch => _.indexOf(config.channels, ch.title) > -1);
        logger_1.default.info('Подписываемся на следующие каналы %s', _.map(chats, ch => String(ch.id) + ':' + ch.title).join(', '));
        const chatTarget = _.find(d.chats, ch => ch.title == config.channel_target);
        if (!chatTarget) {
            throw 'Не нашли целевого канала ' + config.channel_target + ' !';
        }
        logger_1.default.info('И направляем в  %s:%s ', chatTarget.id, chatTarget.title);
        tgClient.subscribeToChannels(chats.map(chat => chat.id), chatTarget.id);
        wasConnected = true;
        setInterval(() => {
            if (tgClient.isSoOldUpdate()) {
                throw 'has not been updated for a long time';
            }
        }, 15000);
    })();
    process.on('unhandledRejection', (reason, p) => {
        console.log('error', reason, p);
        // console.log('rejection');
        process.exit(4);
    });
}
