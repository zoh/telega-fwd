import {getCfgApi, getCfgApp, isDebug} from "./config";
import {TgramClient} from "./tgram/tgram-client";
import * as _ from "lodash";
import logger from "./logger";
import rootStore from "./store/root";
import {timeout} from "./utils";
import * as cluster from 'cluster';

const config = getCfgApp();
const api = getCfgApi();


if (cluster.isMaster) {

  cluster.fork();

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`, code, signal);

    if (code > 0) {
      cluster.fork()
    }
  });

} else {

  let wasConnected = false;

  // n minute time out
  setTimeout(() => {
    if (wasConnected == false) {
      throw 'Too later didn\'t connected.';
    }
  }, 2 * 60 * 1000);

  (async function () {
    const tgClient = new TgramClient(config, api, rootStore.messagesStore);

    // 5sec timeout
    await timeout(2000);
    await tgClient.init();
    await timeout(2000);

    // находим id каналов нам нужно подписаться
    let d = await tgClient.getDialogs();


    if (isDebug) {
      console.log('Show all channels');
      for (let c of d.chats) {
        console.log(c.id, c.title);
      }
    }

    let chats = _.filter(d.chats, ch => _.indexOf(config.channels, ch.title) > -1);
    logger.info('Подписываемся на следующие каналы %s', _.map(chats, ch => String(ch.id) + ':' + ch.title).join(', '));

    const chatTarget: Chat = _.find(d.chats, ch => ch.title == config.channel_target);
    if (!chatTarget) {
      throw 'Не нашли целевого канала ' + config.channel_target + ' !';
    }
    logger.info('И направляем в  %s:%s ', chatTarget.id, chatTarget.title);

    tgClient.subscribeToChannels(chats.map(chat => chat.id), chatTarget.id);

    wasConnected = true;

    setInterval(() => {
      if (tgClient.isSoOldUpdate()) {
        throw 'has not been updated for a long time';
      }
    }, 15000)
  })();


  process.on('unhandledRejection', (reason, p) => {
    console.log('error', reason, p);
    // console.log('rejection');
    process.exit(4);
  });
}