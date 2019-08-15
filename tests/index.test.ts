import { createServer, installTests, registrateOnAbort } from './server';
import * as request from 'supertest';
import { Server } from '../src';
import { abortReq, delay, Info } from './utils';

let server: Server;
let listenSocket: any;
describe('Testing server creation', function() {
  it('Creating server', () => {
    server = createServer();
  });

  it('Installing other tests', () => {
    installTests(server);
  });

  it('Listen server', () => {
    server.listen(8080, socket => {
      listenSocket = socket;
    });
  });
});

describe('Testing server api', () => {
  const requester = request('http://localhost:8080');

  it('Test main ', async () => {
    const result = await requester.get('/');
    expect(result.text).toBe('Get ok');
  });

  describe('Test router', () => {
    it('Testing route root', async () => {
      const result = await requester.get('/router');
      expect(result.text).toBe('Router root');
    });

    it('Testing not route root', async () => {
      const result = await requester.get('/router/notroot');
      expect(result.text).toBe('Not route root');
    });
  });

  describe('Testing write methdos', () => {
    it('Test write types', async () => {
      const result = await requester.get('/writetest');
      expect(result.text).toStrictEqual(
        'String; A\u0000r\u0000r\u0000a\u0000y\u0000 \u0000B\u0000u\u0000f\u0000f\u0000e\u0000r\u0000;\u0000 \u0000Iterable'
      );
    });

    it('Test write header', done => {
      const result = requester.get('/headers');
      result.expect('header', 'value');
      result.expect('multiple-header1', 'v1');
      result.expect('multiple-header2', 'v2');
      result.end(done);
    });

    it('Test write status', done => {
      const result = requester.get('/status');
      result.expect(500);
      result.end(done);
    });

    it('Test write status with msg', done => {
      const result = requester.get('/statusMsg');
      result.expect(500);
      result.end(done);
    });

    it('Test undefined end', async () => {
      const result = await requester.get('/undefinedend');
      expect(result.text).toBe('');
    });

    it('Testing async abort', async done => {
      registrateOnAbort(() => done());
      abortReq();
    });
  });

  describe('Testing get info methods', () => {
    let stdResult: Info = {
      headers: {
        'accept-encoding': 'gzip, deflate',
        connection: 'close',
        host: 'localhost:8080',
        'user-agent': 'node-superagent/3.8.3'
      },
      method: 'GET',
      query: {},
      rawquery: '',
      url: '/info'
    };

    it('Standart info', async () => {
      const result = await requester.get('/info');
      expect(JSON.parse(result.text)).toEqual(stdResult);
    });

    it('Test sindle query', async () => {
      const result = await requester.get('/info?hey=ok');
      let correctResult: Info = Object.assign({}, stdResult);
      correctResult.query = {
        hey: 'ok'
      };
      correctResult.rawquery = 'hey=ok';
      expect(JSON.parse(result.text)).toEqual(correctResult);
    });

    it('Test query parameter without value', async () => {
      const result = await requester.get('/info?ll');
      let correctResult: Info = Object.assign({}, stdResult);
      correctResult.query = {
        ll: ''
      };
      correctResult.rawquery = 'll';
      expect(JSON.parse(result.text)).toEqual(correctResult);
    });

    it('Test headers', async () => {
      const result = await requester
        .get('/info')
        .set('Hey', 'OK')
        .set('Now', 'Right');
      let correctResult: Info = Object.assign({}, stdResult);
      correctResult.headers = Object.assign({}, correctResult.headers);
      correctResult.headers['hey'] = 'OK';
      correctResult.headers['now'] = 'Right';
      correctResult.heyheader = 'OK';
      expect(JSON.parse(result.text)).toEqual(correctResult);
    });

    it('Test method', async () => {
      const result = await requester.put('/info');
      let correctResult: Info = Object.assign({}, stdResult);
      correctResult.headers = Object.assign({}, correctResult.headers);
      correctResult.headers['content-length'] = '0';
      correctResult.method = 'PUT';
      expect(JSON.parse(result.text)).toEqual(correctResult);
    });

    it('Test two refs 1', async () => {
      const result = await requester.get('/ref/ab/cd');
      expect(JSON.parse(result.text)).toEqual({
        a: 'ab',
        b: 'cd'
      });
    });

    it('Test two refs 2', async () => {
      const result = await requester.get('/ref/h/l');
      expect(JSON.parse(result.text)).toEqual({
        a: 'h',
        b: 'l'
      });
    });

    it('Test one ref', async () => {
      const result = await requester.get('/refone/g');
      expect(JSON.parse(result.text)).toEqual({
        a: 'g'
      });
    });

    it('Test read body', async () => {
      const result = await requester.post('/readbody').send('Hello');
      expect(JSON.parse(result.text)).toEqual({
        body: 'Hello'
      });
    });

    it('Test big read body', async () => {
      const result = await requester.post('/readbody').send('four'.repeat(256 * 256 * 2));
      expect(JSON.parse(result.text)).toEqual({
        body: 'four'.repeat(256 * 256 * 2)
      });
    });

    it('Test get ip', async () => {
      await requester.get('/ip');
    });
  });

  describe('Test high level api', () => {
    it('File get', async () => {
      const result = await requester.get('/file');
      expect(result.text).toBe('Test! '.repeat(256));
    });

    it('File get compress', async () => {
      const result = await requester.get('/filecompress');
      expect(result.text).toBe('Test! '.repeat(256));
    });

    it('File get 304', async () => {
      const result = requester.get('/file').set('If-Modified-Since', new Date().toUTCString());
      result.expect(304);
      await result;
    });

    it('File err', async () => {
      const result = requester.get('/nonexistingfile');
      result.expect(500);
      await result;
    });

    it('Redirect', async () => {
      // Not work because of headers must be no lowwercased
      const result = await requester.get('/redirect');
      expect(result.redirect).toBe(true);
    });

    it('File range', async () => {
      const result = await requester.get('/file').set('Range', 'bytes=4-10');
      expect(result.text).toBe('! Test!');
    });

    it('File range 2', async () => {
      const result = await requester.get('/file').set('Range', 'bytes=1530');
      expect(result.text).toBe('Test! ');
    });

    it('File null size file', async () => {
      const result = await requester.get('/nullsizefile');
      expect(result.text).toBe('');
    });
  });
});

afterAll(() => {
  require('uWebSockets.js').us_listen_socket_close(listenSocket);
});
