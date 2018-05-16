"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Nedb = require("nedb");
class LoggingStore extends Nedb {
    constructor(filename) {
        super({ filename, autoload: true });
    }
    saveLog(l) {
        return new Promise((resolve, reject) => {
            this.insert(l, (err, doc) => {
                if (err) {
                    return reject(err);
                }
                //
                resolve(doc);
            });
        });
    }
    /**
     * Получаем список логов
     */
    getLogs(limit = 10) {
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
exports.LoggingStore = LoggingStore;
