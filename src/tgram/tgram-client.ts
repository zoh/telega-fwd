import { CfgApi, CfgApp, isDebug } from "../config";
import MTProto from "telegram-mtproto";
import Storage from "mtproto-storage-fs";
import * as readline from "readline";
import * as _ from "lodash";
import { IMessagesStore } from "../store/messages";
import logger from "../logger";

// const updateNewChannelMessage = "updateNewChannelMessage";

export interface ITgramClient {
  subscribeToChannels(channelIDs: number[], channelTargetID: number);

  sendMessageUser(userId, text: string): Promise<any>;
}

export class TgramClient implements ITgramClient {
  public client;
  protected storage: Storage;

  protected messagesStore: IMessagesStore;

  constructor(
    private cfgApp: CfgApp,
    api: CfgApi,
    messagesStore: IMessagesStore
  ) {
    const server = {
      webogram: true,
      dev: cfgApp.dev
    };

    const app = {
      storage: new Storage(cfgApp.storagePath)
    };

    this.storage = app.storage;
    this.client = MTProto({ server, api, app });
    this.messagesStore = messagesStore;
  }

  async init() {
    if (!await this.storage.get("signedin")) {
      console.log("not signed in");

      await this.login();

      console.log("signed in successfully");
      this.storage.set("signedin", true);
    } else {
      console.log("already signed in");
    }
  }

  async login() {
    const client = this.client;
    const phoneNum = this.cfgApp.phoneNumber;

    const { phone_code_hash } = await client("auth.sendCode", {
      phone_number: phoneNum,
      current_number: true,
      api_id: this.cfgApp.apiID,
      api_hash: this.cfgApp.apiHash
    });

    const phone_code = await this.askForCode();
    console.log(`Your code: ${phone_code}`);

    const { user } = await client("auth.signIn", {
      phone_number: phoneNum,
      phone_code_hash: phone_code_hash,
      phone_code: phone_code
    });
    console.log("signed as ", user);
  }

  // This function will stop execution of the program until you enter the code
  // that is sent via SMS or Telegram.
  async askForCode() {
    return new Promise(resolve => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      rl.question(
        "Please enter passcode for " + this.cfgApp.phoneNumber + ":\n",
        num => {
          rl.close();
          resolve(num);
        }
      );
    });
  }

  protected hashToChannels: Map<number, string> = new Map();

  async getDialogs(): Promise<Dialogs> {
    const res: Dialogs = await this.client("messages.getDialogs", {
      limit: 1000
    });

    // считываем все каналы чтобы получить их хеши
    _.forEach(res.chats, (chat: Chat) => {
      this.hashToChannels.set(chat.id, chat.access_hash);
    });

    return res;
  }

  protected lastUpdatesTime: number;

  public isSoOldUpdate() {
    // 1 min
    return Date.now() - this.lastUpdatesTime > 60 * 1000;
  }

  protected updatesGetStateChannel(channelID) {
    const run = () =>
      setTimeout(async () => {
        try {
          if (isDebug) {
            console.log("ping channel", channelID);
          }

          // ping new messages from one channel
          await this.getChannelDifferenceRequest(channelID);
        } catch (e) {
          console.log("err", e);
        } finally {
          run();
        }
      }, 1500);
    run();
  }

  protected updatesGetState() {
    const run = () =>
      setTimeout(async () => {
        try {
          if (isDebug) {
            console.log("ping");
          }
          await this.client("updates.getState", {});
        } catch (e) {
          console.log("err", e);
        } finally {
          run();
        }
      }, 1000); //15s, may be flood
    run();
  }

  protected subscribeChannelIDs: number[] = [];
  protected channelTargetID: number;

  public subscribeToChannels(channelIDs: number[], channelTargetID: number) {
    this.subscribeChannelIDs = channelIDs;
    this.channelTargetID = channelTargetID;

    for (let channelID of this.subscribeChannelIDs) {
      this.updatesGetStateChannel(channelID);
    }

    this.updatesGetState();

    // console.log(channelTargetID, channelIDs);

    /*this.client.bus.untypedMessage.observe(async (event: EventUpdate) => {
     const mess = event.message;

     if (isDebug) {
     await this.messagesStore.saveMsg(event);
     }

     if (mess.updates) {
     _.forEach(
     _.filter(mess.updates, (u: Update) => u._ == updateNewChannelMessage),
     async updateMess => {
     if (updateMess && updateMess.message) {
     if (
     _.indexOf(channelIDs, updateMess.message.to_id.channel_id) > -1
     ) {
     // пробуем переправить в канал
     await this.fwdToChannel(
     updateMess.message.to_id.channel_id,
     channelTargetID,
     updateMess.message.id
     );
     }
     }
     }
     );
     }
     });*/
  }

  protected channelToPTS: Map<number, number> = new Map();

  async getChannelDifferenceRequest(channelID: number) {
    let pts = this.channelToPTS.has(channelID)
      ? this.channelToPTS.get(channelID)
      : 1;

    logger.info(
      "Send updates.getChannelDifference id=%d pts=%s",
      channelID,
      pts
    );
    let differenceResult = await this.client("updates.getChannelDifference", {
      channel: {
        _: "inputChannel",
        channel_id: channelID,
        access_hash: this.hashToChannels.get(channelID)
      },
      filter: { _: "channelMessagesFilterEmpty" },
      pts: pts,
      limit: 30
    });

    this.channelToPTS.set(channelID, differenceResult.pts);

    logger.info(JSON.stringify(differenceResult));

    let ids = _.map(differenceResult.new_messages, (mess: Message) => +mess.id);

    if (_.size(ids) == 0) {
      return;
    }
    await this.fwdToChannel(channelID, this.channelTargetID, ids);
  }

  async sendMessageUser(userId: number, text: string) {
    await this.client("messages.sendMessage", {
      peer: {
        _: "inputPeerUser",
        user_id: userId
        // user_id: 88689249,
        // access_hash: this.hash,
      },
      message: text,
      random_id: Date.now()
    });
  }

  async fwdToChannel(fromChannelID, toChID, postIds: number[]) {
    if (isDebug) {
      console.log("messages.forwardMessages", fromChannelID, toChID, postIds);
    }

    let len = postIds.length;
    let randomIDs = [];
    for (let i = 0; i < len; i++) {
      randomIDs.push([nextRandomInt(0xffffffff), nextRandomInt(0xffffffff)]);
    }

    let res = await this.client("messages.forwardMessages", {
      from_peer: {
        _: "inputPeerChannel",
        channel_id: fromChannelID,
        access_hash: this.hashToChannels.get(fromChannelID)
      },
      to_peer: {
        _: "inputPeerChannel",
        channel_id: toChID,
        access_hash: this.hashToChannels.get(toChID)
      },

      id: postIds,

      random_id: randomIDs
    });

    if (isDebug) {
      console.log("Send ok", res);
    }
  }
}

function nextRandomInt(maxValue) {
  return Math.floor(Math.random() * maxValue);
}
