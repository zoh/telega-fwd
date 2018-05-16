"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// const readline = require('readline');
const MtpProxy = require("telejs");
const _ = require("lodash");
const readline = require("readline");
const fs = require("fs");
(async () => {
    try {
        await MtpProxy.init(state => new Promise((resolve, reject) => {
            fs.writeFile("./test/state.json", state, "utf8", err => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        }), null, "verbose");
        console.log("set DC");
        // await MtpProxy.MtpAuthorizer.auth(2);
        await MtpProxy.mtpGetNetworker(2);
        await timeout();
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        const codeInputPromise = () => new Promise(resolve => {
            rl.question("Code? ", code => {
                resolve(code);
                rl.close();
            });
        });
        console.log("signInUser");
        await MtpProxy.signInUser("+420776507302", codeInputPromise);
        const res = await MtpProxy.mtpInvokeApi("messages.getDialogs", {
            limit: 100,
            offset_peer: { _: "inputPeerEmpty" }
        });
        // console.log(
        //   res.chats, '?'
        // );
        _.forEach(res.chats, (r) => {
            console.log(r.id, r.title, "?");
        });
    }
    catch (e) {
        console.log("Error!");
        console.log(e);
    }
})();
async function timeout() {
    return new Promise(resolve => {
        setTimeout(resolve, 5000);
    });
}
