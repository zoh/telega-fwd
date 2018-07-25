import { CfgApp, isDebug } from "../config";
import * as MtpProxy from "telejs";
import * as readline from "readline";
import * as _ from "lodash";
import { IMessagesStore } from "../store/messages";
import logger from "../logger";
import * as fs from "fs";
import { timeout } from "../utils";

// const updateNewChannelMessage = "updateNewChannelMessage";

export interface ITgramClient {
  subscribeToChannels(channelIDs: number[], channelTargetID: number);

  sendMessageUser(userId, text: string): Promise<any>;
}

export class TgramClient implements ITgramClient {
  protected messagesStore: IMessagesStore;

  constructor(private cfgApp: CfgApp, messagesStore: IMessagesStore) {
    this.messagesStore = messagesStore;
  }

  async init() {
    // считываем сразу файш
    let resolveFile = null;
    const pathFile = this.cfgApp.storagePath;
    //
    if (fs.existsSync(pathFile)) {
      const res = fs.readFileSync(pathFile, "utf8");
      resolveFile = Promise.resolve(res);
    }

    await MtpProxy.init(
      state =>
        new Promise((resolve, reject) => {
          fs.writeFile(pathFile, state, "utf8", err => {
            if (err) {
              reject(err);
              return;
            }
            resolve();
          });
        }),
      resolveFile ? () => resolveFile : null,
      "info"
    );
    await timeout();

    const isAuth = !!resolveFile;

    console.log("IsAuth?", isAuth);
    console.log("set DC");
    await MtpProxy.mtpGetNetworker(2);
    await timeout();

    if (!isAuth) {
      await this.login();
    }
  }

  async login() {
    const phoneNum = this.cfgApp.phoneNumber;

    console.log("Need auth!");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const codeInputPromise = () =>
      new Promise(resolve => {
        rl.question("Code? ", code => {
          resolve(code);
          rl.close();
        });
      });

    console.log("signInUser");
    await MtpProxy.signInUser(phoneNum, codeInputPromise);
  }

  protected hashToChannels: Map<number, string> = new Map();

  async getDialogs(): Promise<Dialogs> {
    const res: Dialogs = await MtpProxy.mtpInvokeApi("messages.getDialogs", {
      limit: 1000,
      offset_peer: { _: "inputPeerEmpty" }
    });

    // считываем все каналы чтобы получить их хеши
    _.forEach(res.chats, (chat: Chat) => {
      this.hashToChannels.set(chat.id, chat.access_hash);
    });

    return res;
  }

  protected lastUpdatesTime: number = Date.now();

  public isSoOldUpdate(): boolean {
    // 1 min
    const t = Date.now() - this.lastUpdatesTime;
    return t > 60 * 1000;
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
          this.lastUpdatesTime = Date.now();
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
          await MtpProxy.mtpInvokeApi("updates.getState", {});
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
    let differenceResult = await MtpProxy.mtpInvokeApi(
      "updates.getChannelDifference",
      {
        channel: {
          _: "inputChannel",
          channel_id: channelID,
          access_hash: this.hashToChannels.get(channelID)
        },
        filter: { _: "channelMessagesFilterEmpty" },
        pts: pts,
        limit: 30
      }
    );

    this.channelToPTS.set(channelID, differenceResult.pts);
    logger.info(JSON.stringify(differenceResult));

    let ids = _.map(differenceResult.new_messages, (mess: Message) => +mess.id);

    if (_.size(ids) == 0) {
      return;
    }
    await this.fwdToChannel(channelID, this.channelTargetID, ids);
  }

  async sendMessageUser(userId: number, text: string) {
    await MtpProxy.mtpInvokeApi("messages.sendMessage", {
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

    let res = await MtpProxy.mtpInvokeApi("messages.forwardMessages", {
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
