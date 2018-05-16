import * as Nedb from "nedb";

type Message = {
  _id?: string;
  message: Object;

  timestamp: string; // "2018-03-14T10:41:33.686Z";
};

export interface IMessagesStore {
  saveMsg(l: any): Promise<Message>;

  getMessages(limit?: number): Promise<Message[]>;
}

export class MessagesStore extends Nedb implements IMessagesStore {
  constructor(filename: string) {
    super({ filename, autoload: true });
  }

  saveMsg(data: any): Promise<Message> {
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

  getMessages(limit = 10): Promise<Message[]> {
    return new Promise((resolve, reject) => {
      this.find({})
        .sort({ timestamp: -1 })
        .limit(limit)
        .exec((err, docs: Message[]) => {
          if (err) {
            return reject(err);
          }
          resolve(docs);
        });
    });
  }
}
