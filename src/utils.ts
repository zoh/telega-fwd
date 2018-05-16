import * as moment from "moment";


export const formatDate = (timestamp) => {
  return moment(timestamp).format('YYYY-MM-DD HH:mm:ss')
};


export async function wrapAttempts<T>(fn: () => Promise<T>, attempts: number = 3): Promise<T> {
  if (attempts <= 0 || attempts > 10) {
    throw 'не корректное число попыток';
  }

  let err: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      err = e;
      console.log(e);
    }
    await timeout();
  }
  if (err) {
    throw err
  }
}


export async function timeout(t = 1000) {
  return new Promise((resolve) => {
    setTimeout(resolve, t)
  })
}

export function NowTimeStamp() {
  return new Date().toISOString()
}


export function toFixed8(val: number) {
  return +(val.toFixed(8))
}