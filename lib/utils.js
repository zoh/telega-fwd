"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const moment = require("moment");
exports.formatDate = (timestamp) => {
    return moment(timestamp).format('YYYY-MM-DD HH:mm:ss');
};
async function wrapAttempts(fn, attempts = 3) {
    if (attempts <= 0 || attempts > 10) {
        throw 'не корректное число попыток';
    }
    let err;
    for (let i = 0; i < attempts; i++) {
        try {
            return await fn();
        }
        catch (e) {
            err = e;
            console.log(e);
        }
        await timeout();
    }
    if (err) {
        throw err;
    }
}
exports.wrapAttempts = wrapAttempts;
async function timeout(t = 1000) {
    return new Promise((resolve) => {
        setTimeout(resolve, t);
    });
}
exports.timeout = timeout;
function NowTimeStamp() {
    return new Date().toISOString();
}
exports.NowTimeStamp = NowTimeStamp;
function toFixed8(val) {
    return +(val.toFixed(8));
}
exports.toFixed8 = toFixed8;
