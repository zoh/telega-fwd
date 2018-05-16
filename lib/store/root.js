"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logging_1 = require("./logging");
const messages_1 = require("./messages");
const config_1 = require("../config");
class StoreProvider {
    constructor(fileNameLog, messagesStore) {
        this.logStore = new logging_1.LoggingStore(fileNameLog);
        this.messagesStore = new messages_1.MessagesStore(messagesStore);
    }
}
exports.StoreProvider = StoreProvider;
exports.default = new StoreProvider(config_1.LOGGIN_STORE_DB, config_1.MESSAGES_STORE_DB);
