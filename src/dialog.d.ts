
/*
 {
 "_": "channel",
 "flags": 9536,
 "megagroup": true,
 "democracy": true,
 "id": 1133401767,
 "access_hash": "8180610103281919803",
 "title": "Solve.Care",
 "username": "SolveCare",

 "date": 1517860377,
 "version": 0
 },
 */
declare type Chat = {
  "_": "channel",
  "flags": 9536,
  "megagroup": true,
  "democracy": true,
  "id": 1133401767,
  "access_hash": "8180610103281919803",
  "title": "Solve.Care",
  "username"?: "SolveCare",

  "date": 1517860377,
  "version": 0
}

declare type Dialogs = {
  "_": "messages.dialogs";
  dialogs: any;
  messages: any;
  chats: Chat[];

  users: User[];
}

declare type User = {
  "_": "user";

  contact: boolean
  flags: number;
  id: number;
  access_hash: string;
  "first_name": string,
  "last_name": string
  "username": string
}

/*
 {
 "_": "user",
 "flags": 111,
 "id": 474355538,
 "access_hash": "6331687606937661327",
 "first_name": "Titan",
 "last_name": "Live",
 "username": "TitanLive",
 "photo": {
 "_": "userProfilePhoto",
 "photo_id": "2037341522842724265",
 "photo_small": {
 "_": "fileLocation",
 "dc_id": 2,
 "volume_id": "235140679",
 "local_id": 212659,
 "secret": "5466395848043250262"
 },
 "photo_big": {
 "_": "fileLocation",
 "dc_id": 2,
 "volume_id": "235140679",
 "local_id": 212661,
 "secret": "1469591588826895869"
 }
 },
 "status": {
 "_": "userStatusOnline",
 "expires": 1520598693
 }
 },
 */
