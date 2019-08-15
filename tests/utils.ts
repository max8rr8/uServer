import { request } from 'http';

export interface IndexableStringObj {
  [a: string]: string;
}

export interface Info {
  url?: string;
  rawquery?: string;
  method?: string;
  heyheader?: string;
  headers?: IndexableStringObj;
  query?: IndexableStringObj;
}

export function str2ab(str: string) {
  var buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
  var bufView = new Uint16Array(buf);
  for (var i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return bufView;
}

export function delay(delay: number) {
  return new Promise(resolve => {
    setTimeout(resolve, delay);
  });
}

export async function abortReq() {
  const options = {
    host: 'localhost',
    port: 8080,
    path: '/asyncaborttest'
  };

  // Make a request
  const req = request(options);
  req.end();
  await delay(5);
  req.abort();
  req.on('error', () => {});
}