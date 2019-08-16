import { Router, Server } from '../src';
import { str2ab, delay, Info } from './utils';

import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
let pathTmp = path.join(os.tmpdir(), 'test.file.txt');
let nullPathTmp = path.join(os.tmpdir(), 'null.file.txt');
fs.writeFileSync(pathTmp, 'Test! '.repeat(256));
fs.writeFileSync(nullPathTmp, '');

export function createServer() {
  const server = new Server();
  server.http('GET', '/', ctx => ctx.end('Get ok'));

  let router = new Router();
  router.http('GET', '', ctx => ctx.end('Router root'));
  router.http('GET', '/notroot', ctx => ctx.end('Not route root'));
  server.connect('/router', router);

  return server;
}

let onAbort = () => {
  console.log('HEU');
};

export function installTests(server: Server) {
  server.http('GET', '/writetest', ctx => {
    ctx.write('String; ');
    ctx.write(str2ab('Array Buffer; '));
    ctx.write([0x49, 0x74, 0x65, 0x72, 0x61, 0x62, 0x6c, 0x65]); //Iterable
    ctx.write();
    ctx.end(); // TODO: fix bug in empty ctx write doesn't end
  });

  server.http('GET', '/headers', ctx => {
    ctx.writeHeader('header', 'value');
    ctx.writeHeaders({
      'multiple-header1': 'v1',
      'multiple-header2': 'v2'
    });
    ctx.end();
  });

  server.http('GET', '/status', ctx => {
    ctx.writeStatus(500);
    ctx.end(); 
  });

  server.http('GET', '/statusMsg', ctx => {
    ctx.writeStatus(500, 'Serv fail');
    ctx.end();
  });

  server.http('GET', '/undefinedend', ctx => {
    ctx.end(undefined); // TODO: undefined end must be called always
  });

  server.http('GET', '/asyncaborttest', async ctx => {
    await delay(10);
    ctx.write();
    ctx.end();
    if (ctx.isAborted) onAbort();
  });

  server.http('ANY', '/info', ctx => {
    ctx.getQuery(); // Get quary first time

    let res: Info = {};
    res.query = ctx.getQuery();
    res.headers = ctx.getHeaders();
    res.heyheader = ctx.getHeader('Hey');
    res.method = ctx.getMethod();
    res.url = ctx.getUrl();
    res.rawquery = ctx.getRawQuery();

    ctx.end(JSON.stringify(res));
  });

  server.http('ANY', '/ref/:a/:b', ctx => {
    let res: {
      a?: string;
      b?: string;
    } = {};

    res.a = ctx.getRef('a');
    res.b = ctx.getRef('b');

    ctx.end(JSON.stringify(res));
  });

  server.http('ANY', '/refone/:a', ctx => {
    let res: {
      a?: string;
    } = {};

    res.a = ctx.getRef('a');

    ctx.end(JSON.stringify(res));
  });

  server.http('ANY', '/readbody', async ctx => {
    ctx.end(
      JSON.stringify({
        body: (await ctx.readBody()).toString()
      })
    );
  });

  server.http('GET', '/ip', async ctx => {
    ctx.getRemoteIP();
    ctx.end();
  });

  server.http('GET', '/file', async ctx => {
    ctx.sendFile(pathTmp);
  });

  server.http('GET', '/filecompress', async ctx => {
    ctx.sendFile(pathTmp, {
      lastModified: false,
      compress: true,
      compressPriority: ['gzip', 'br', 'deflate']
    });
  });

  server.http('GET', '/nonexistingfile', async ctx => {
    ctx.sendFile('/t.txt');
  });

  server.http('GET', '/nullsizefile', async ctx => {
    ctx.sendFile(nullPathTmp);
  });

  server.http('GET', '/redirect', async ctx => {
    ctx.redirect('/');
  });
}

export function registrateOnAbort(callback: () => void) {
  onAbort = callback;
}
