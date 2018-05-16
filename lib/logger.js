"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const winston = require("winston");
const util = require("util");
const root_1 = require("./store/root");
const utils_1 = require("./utils");
const { format, createLogger } = winston;
const { timestamp, printf } = format;
class StoreTransport extends winston.Transport {
    constructor(store) {
        super({ store });
        this.store = store;
        //
        // Consume any custom options here. e.g.:
        // - Connection information for databases
        // - Authentication information for APIs (e.g. loggly, papertrail,
        //   logentries, etc.).
        //
    }
    log(info, callback) {
        setImmediate(async () => {
            try {
                await this.store.saveLog(info);
            }
            catch (e) {
                util.error('Ошибка при запись в ', e);
            }
            this.emit('logged', info);
        });
        callback();
    }
}
const myFormat = printf(info => {
    return `${utils_1.formatDate(info.timestamp)} ${info.level.toUpperCase()}|${info.label ? ' [' + info.label + '] ' : ''}: ${info.message}`;
});
const logger = createLogger({
    format: format.combine(format.splat(), format.simple(), timestamp(), myFormat),
    transports: [
        new (winston.transports.Console)({
            level: 'debug'
        }),
        // new winston.transports.Console(),
        // new winston.transports.File({filename: 'combined.log'}),
        new StoreTransport(root_1.default.logStore)
    ]
});
exports.default = logger;
