import { ILoggingStore, LoggingStore } from "./logging";
import { IMessagesStore, MessagesStore } from "./messages";
import { LOGGIN_STORE_DB, MESSAGES_STORE_DB } from "../config";

export class StoreProvider {
  public readonly logStore: ILoggingStore;
  public readonly messagesStore: IMessagesStore;

  constructor(fileNameLog: string, messagesStore: string) {
    this.logStore = new LoggingStore(fileNameLog);
    this.messagesStore = new MessagesStore(messagesStore);
  }
}

export default new StoreProvider(LOGGIN_STORE_DB, MESSAGES_STORE_DB);
