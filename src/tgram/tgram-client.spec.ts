// import "mocha";
// import { TgramClient } from "./tgram-client";
//
// xdescribe("Spec telegram client", () => {
//   const config = {
//     phoneNumber: "+79631218671",
//     apiID: 156657,
//     apiHash: "b8cf5269ba047aae6132852374630101",
//     storagePath: "./storage/storage.json",
//     dev: false,
//     channels: ["TestCryptoPumpChannel"]
//   };
//   const api = {
//     layer: 57,
//     initConnection: 0x69796de9,
//     api_id: 156657
//   };
//
//   const tgClient = new TgramClient(config, api);
//
//   before(done => {
//     tgClient.init().then(() => {
//       setTimeout(async () => {
//         const dialogs = await tgClient.getDialogs();
//
//         console.log(JSON.stringify(dialogs));
//         done();
//       }, 2000);
//     });
//     //
//     // console.log(JSON.stringify(dialogs));
//   });
//
//   it("test send channel", async () => {});
// });
