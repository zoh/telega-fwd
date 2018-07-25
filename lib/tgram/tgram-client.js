"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../config");
const MtpProxy = require("telejs");
const readline = require("readline");
const _ = require("lodash");
const logger_1 = require("../logger");
const fs = require("fs");
const utils_1 = require("../utils");
class TgramClient {
    constructor(cfgApp, messagesStore) {
        this.cfgApp = cfgApp;
        this.hashToChannels = new Map();
        this.lastUpdatesTime = Date.now();
        this.subscribeChannelIDs = [];
        this.channelToPTS = new Map();
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
        await MtpProxy.init(state => new Promise((resolve, reject) => {
            fs.writeFile(pathFile, state, "utf8", err => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        }), resolveFile ? () => resolveFile : null, "info");
        await utils_1.timeout();
        const isAuth = !!resolveFile;
        console.log("IsAuth?", isAuth);
        console.log("set DC");
        await MtpProxy.mtpGetNetworker(2);
        await utils_1.timeout();
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
        const codeInputPromise = () => new Promise(resolve => {
            rl.question("Code? ", code => {
                resolve(code);
                rl.close();
            });
        });
        console.log("signInUser");
        await MtpProxy.signInUser(phoneNum, codeInputPromise);
    }
    async getDialogs() {
        const res = await MtpProxy.mtpInvokeApi("messages.getDialogs", {
            limit: 1000,
            offset_peer: { _: "inputPeerEmpty" }
        });
        // считываем все каналы чтобы получить их хеши
        _.forEach(res.chats, (chat) => {
            this.hashToChannels.set(chat.id, chat.access_hash);
        });
        return res;
    }
    isSoOldUpdate() {
        // 1 min
        const t = Date.now() - this.lastUpdatesTime;
        return t > 60 * 1000;
    }
    updatesGetStateChannel(channelID) {
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
                this.lastUpdatesTime = Date.now();
                run();
            }
        }, 1500);
        run();
    }
    updatesGetState() {
        const run = () => setTimeout(async () => {
            try {
                if (config_1.isDebug) {
                    console.log("ping");
                }
                await MtpProxy.mtpInvokeApi("updates.getState", {});
            }
            catch (e) {
                console.log("err", e);
            }
            finally {
                run();
            }
        }, 1000); //15s, may be flood
        run();
    }
    subscribeToChannels(channelIDs, channelTargetID) {
        this.subscribeChannelIDs = channelIDs;
        this.channelTargetID = channelTargetID;
        for (let channelID of this.subscribeChannelIDs) {
            this.updatesGetStateChannel(channelID);
        }
        this.updatesGetState();
    }
    async getChannelDifferenceRequest(channelID) {
        let pts = this.channelToPTS.has(channelID)
            ? this.channelToPTS.get(channelID)
            : 1;
        logger_1.default.info("Send updates.getChannelDifference id=%d pts=%s", channelID, pts);
        let differenceResult = await MtpProxy.mtpInvokeApi("updates.getChannelDifference", {
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
        if (_.size(ids) == 0) {
            return;
        }
        await this.fwdToChannel(channelID, this.channelTargetID, ids);
    }
    async sendMessageUser(userId, text) {
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
    async fwdToChannel(fromChannelID, toChID, postIds) {
        if (config_1.isDebug) {
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
        if (config_1.isDebug) {
            console.log("Send ok", res);
        }
    }
}
exports.TgramClient = TgramClient;
function nextRandomInt(maxValue) {
    return Math.floor(Math.random() * maxValue);
}
