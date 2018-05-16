/*

 let a = {
 "_": "updates",
 "updates": [
 {
 "_": "updateNewChannelMessage",
 "message": {
 "_": "message",
 "flags": 17408,
 "post": true,
 "id": 19,
 "to_id": {
 "_": "peerChannel",
 "channel_id": 1223970027
 },
 "date": 1520607753,
 "message": "фыв фыв фывф ывфы выф в",
 "views": 1
 },
 "pts": 31,
 "pts_count": 1
 }
 ],
 "users": [],
 "chats": [
 {
 "_": "channel",
 "flags": 8224,
 "broadcast": true,
 "id": 1223970027,
 "access_hash": "12747545705735677445",
 "title": "TestCryptoPumpChannel",
 "photo": {
 "_": "chatPhotoEmpty"
 },
 "date": 1520603137,
 "version": 0
 }
 ],
 "date": 1520607752,
 "seq": 0
 };
 */

declare type EventUpdate = {
  threadID: string
  networkerDC: number
  messageID: string
  sessionID: any

  message: {
    "_": "updates" | "updateShort" | "updateShortMessage" | "updatesCombined"

    id?: number
    user_id?: number
    message?: string

    updates?: Update[]
    chats?: Chat[]

    users?: any

    date: number
    seq: number
  }

  date: 1520607752
  seq: 0,

}


declare type Update = {
  "_": "updateNewMessage" | "updateUserStatus" | "updateReadHistoryInbox" | "updateNewChannelMessage"

  "message"?: Message // if constructor = updateNewMessage
  "pts": 31
  "pts_count": 1
};

declare type Message = {
  "_": "message"
  "flags": 17408,
  "post": true,
  "id": 19,
  "to_id": {
    "_": "peerChannel",
    "channel_id": 1223970027
  },
  "date": 1520607753,
  "message": "фыв фыв фывф ывфы выф в",
  "views": number;

  from_id?: number;
}