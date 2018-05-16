import * as winston from "winston";
import {ILoggingStore} from "./store/logging";
import * as util from "util";
import rootStore from "./store/root";
import {formatDate} from "./utils";

const {format, createLogger} = winston as any;
const {timestamp, printf} = format as any;

class StoreTransport extends winston.Transport {
  constructor(public store: ILoggingStore) {
    super({store});
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
      } catch (e) {
        util.error('Ошибка при запись в ', e);
      }

      this.emit('logged', info);
    });
    callback();
  }
}

const myFormat = printf(info => {
  return `${formatDate(info.timestamp)} ${info.level.toUpperCase()}|${info.label ? ' [' + info.label + '] ' : ''}: ${info.message}`;
});


const logger = createLogger({

  format: format.combine(
    format.splat(),
    format.simple(),
    timestamp(),
    myFormat,
  ),

  transports: [
    new (winston.transports.Console)({
      level: 'debug'
    }),
    // new winston.transports.Console(),
    // new winston.transports.File({filename: 'combined.log'}),
    new StoreTransport(rootStore.logStore)
  ]
});

export default logger