import * as Nedb from "nedb";

type Log = {
  label: "test";
  level: "error";
  message: "oror";
  timestamp: "2018-03-14T10:41:33.686Z";
};

export interface ILoggingStore {
  saveLog(l: Log): Promise<Log>;

  getLogs(limit?: number): Promise<Log[]>;
}

export class LoggingStore extends Nedb implements ILoggingStore {
  constructor(filename: string) {
    super({ filename, autoload: true });
  }

  saveLog(l: Log): Promise<Log> {
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
  getLogs(limit = 10): Promise<Log[]> {
    return new Promise((resolve, reject) => {
      this.find({})
        .sort({ timestamp: -1 })
        .limit(limit)
        .exec((err, docs: Log[]) => {
          if (err) {
            return reject(err);
          }
          resolve(docs);
        });
    });
  }
}
