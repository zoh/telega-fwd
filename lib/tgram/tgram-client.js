"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../config");
const telegram_mtproto_1 = require("telegram-mtproto");
const mtproto_storage_fs_1 = require("mtproto-storage-fs");
const readline = require("readline");
const _ = require("lodash");
const logger_1 = require("../logger");
class TgramClient {
    constructor(cfgApp, api, messagesStore) {
        this.cfgApp = cfgApp;
        this.hashToChannels = new Map();
        this.subscribeChannelIDs = [];
        this.channelToPTS = new Map();
        const server = {
            webogram: true,
            dev: cfgApp.dev
        };
        const app = {
            storage: new mtproto_storage_fs_1.default(cfgApp.storagePath)
        };
        this.storage = app.storage;
        this.client = telegram_mtproto_1.default({ server, api, app });
        this.messagesStore = messagesStore;
    }
    async init() {
        if (!await this.storage.get("signedin")) {
            console.log("not signed in");
            await this.login();
            console.log("signed in successfully");
            this.storage.set("signedin", true);
        }
        else {
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
            rl.question("Please enter passcode for " + this.cfgApp.phoneNumber + ":\n", num => {
                rl.close();
                resolve(num);
            });
        });
    }
    async getDialogs() {
        const res = await this.client("messages.getDialogs", {
            limit: 1000
        });
        // считываем все каналы чтобы получить их хеши
        _.forEach(res.chats, (chat) => {
            this.hashToChannels.set(chat.id, chat.access_hash);
        });
        return res;
    }
    isSoOldUpdate() {
        // 1 min
        return Date.now() - this.lastUpdatesTime > 60 * 1000;
    }
    updatesGetState(channelID) {
        const run = () => setTimeout(async () => {
            try {
                if (config_1.isDebug) {
                    console.log("ping channel", channelID);
                }
                // ping new messages from one channel
                await this.getChannelDifferenceRequest(channelID);
            }
            catch (e) {
                console.log("err", e);
            }
            finally {
                run();
            }
        }, 500);
        run();
    }
    subscribeToChannels(channelIDs, channelTargetID) {
        this.subscribeChannelIDs = channelIDs;
        this.channelTargetID = channelTargetID;
        for (let channelID of this.subscribeChannelIDs) {
            this.updatesGetState(channelID);
        }
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
    async getChannelDifferenceRequest(channelID) {
        let pts = this.channelToPTS.has(channelID)
            ? this.channelToPTS.get(channelID)
            : 1;
        logger_1.default.info("Send updates.getChannelDifference id=%d pts=%s", channelID, pts);
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
        logger_1.default.info(JSON.stringify(differenceResult));
        let ids = _.map(differenceResult.new_messages, (mess) => +mess.id);
        await this.fwdToChannel(channelID, this.channelTargetID, ids);
    }
    async sendMessageUser(userId, text) {
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
    async fwdToChannel(fromChannelID, toChID, postIds) {
        if (config_1.isDebug) {
            console.log("messages.forwardMessages", fromChannelID, toChID, postIds);
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
            random_id: [Date.now()]
        });
        if (config_1.isDebug) {
            console.log("Send ok", res);
        }
    }
}
exports.TgramClient = TgramClient;
