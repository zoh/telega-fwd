"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Nedb = require("nedb");
class MessagesStore extends Nedb {
    constructor(filename) {
        super({ filename, autoload: true });
    }
    saveMsg(data) {
        const msg = {
            message: data,
            timestamp: new Date().toISOString()
        };
        return new Promise((resolve, reject) => {
            this.insert(msg, (err, doc) => {
                if (err) {
                    return reject(err);
                }
                //
                resolve(doc);
            });
        });
    }
    getMessages(limit = 10) {
        return new Promise((resolve, reject) => {
            this.find({})
                .sort({ timestamp: -1 })
                .limit(limit)
                .exec((err, docs) => {
                if (err) {
                    return reject(err);
                }
                resolve(docs);
            });
        });
    }
}
exports.MessagesStore = MessagesStore;
