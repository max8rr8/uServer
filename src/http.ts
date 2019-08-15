import { HttpRequest, HttpResponse } from 'uWebSockets.js';
import { httpMethod } from './router';
import { STATUS_CODES } from 'http';
import { stat as oldStat, createReadStream } from 'fs';
import { createBrotliCompress, createGzip, createDeflate } from 'zlib';
import { promisify } from 'util';
import { EventEmitter } from 'events';
import { Readable } from 'stream';

const stat = promisify(oldStat);

const compressors = {
  br: createBrotliCompress,
  deflate: createDeflate,
  gzip: createGzip
};

type ResponseType = Buffer | Uint8Array | Uint16Array | Uint32Array | number[] | string;
interface IndexableStringObj {
  [a: string]: string;
}

function parseQuery(query: string): IndexableStringObj {
  return query
    ? query.split('&').reduce((params: IndexableStringObj, param) => {
        const [key, value] = param.split('=');
        params[key] = value ? decodeURIComponent(value.replace(/\+/g, ' ')) : '';
        return params;
      }, {})
    : {};
}

export class Ctx extends EventEmitter {
  public isAborted: boolean;

  private request: HttpRequest;
  private response: HttpResponse;
  private path: string;

  private allHeaders: IndexableStringObj;
  private refs: IndexableStringObj;
  private rawQuery: string;
  private url: string;
  private method: string;

  private parsedQuery: IndexableStringObj | null;

  constructor(req: HttpRequest, res: HttpResponse, path: string) {
    super();

    this.path = path;
    this.response = res;
    this.request = req;

    this.rawQuery = req.getQuery();
    this.url = req.getUrl();
    this.refs = {};
    this.loadRefs();
    this.allHeaders = {};

    this.request.forEach((k, v) => ((this.allHeaders as IndexableStringObj)[k] = v));
    this.method = req.getMethod();
    this.isAborted = false;
    this.parsedQuery = null;
    this.response.onAborted(() => ((this.isAborted = true), this.emit('aborted')));
  }

  public getRef(ref: string) {
    return this.refs[ref];
  }

  public getHeaders() {
    return this.allHeaders;
  }

  public getHeader(header: string) {
    return this.allHeaders[header.toLowerCase()];
  }

  public getMethod() {
    return this.method.toUpperCase() as httpMethod;
  }

  public getRawQuery() {
    return this.rawQuery;
  }

  public getQuery() {
    if (this.parsedQuery === null) {
      this.parsedQuery = parseQuery(this.getRawQuery());
    }
    return this.parsedQuery;
  }

  public getUrl() {
    return this.url;
  }

  public getRemoteIP() {
    return this.response.getRemoteAddress();
  }

  public async readBody() {
    let buf = Buffer.from('');

    await new Promise((resolve, reject) => {
      this.response.onData((ab, isLast) => {
        const chunk = Buffer.from(ab);
        buf = Buffer.concat([buf, chunk]);
        if (isLast) resolve(buf);
      });

      this.response.onAborted(() => reject());
    });

    return buf;
  }

  public writeHeader(key: string, value: string) {
    this.response.writeHeader(key, value);
  }

  public writeHeaders(headers: IndexableStringObj) {
    for (const key in headers) this.writeHeader(key, headers[key]);
  }

  public writeStatus(code: number, msg?: string) {
    if (!msg) msg = STATUS_CODES[code.toString()];
    this.response.writeStatus(code + ' ' + msg);
  }

  public write(chunk?: ResponseType) {
    if (this.isAborted) return;
    if (chunk === undefined) return;
    this.response.write(this.toRecognizeableString(chunk));
  }

  public async sendFile(
    path: string,
    { lastModified = true, compress = false, compressPriority = ['gzip', 'br', 'deflate'] } = {}
  ) {
    try {
      const fileStat = await stat(path);
      const mtime = fileStat.mtime;
      let size = fileStat.size;
      mtime.setMilliseconds(0);

      if (lastModified) {
        if (this.getHeader('If-Modified-Since'))
          if (new Date(this.getHeader('If-Modified-Since')) >= mtime) {
            this.writeStatus(304);
            this.end();
            return;
          }
        this.writeHeader('Last-Modified', mtime.toUTCString());
      }

      let start = 0;
      let end = size - 1;

      if (this.getHeader('Range')) {
        compress = false;
        const parts = this.getHeader('Range')
          .replace('bytes=', '')
          .split('-');
        start = parseInt(parts[0], 10);
        end = parts[1] ? parseInt(parts[1], 10) : end;
        this.writeHeader('Accept-Ranges', 'bytes');
        this.writeHeader('Content-Range', `bytes ${start}-${end}/${size}`);
        size = end - start + 1;
      }

      if (end < 0) end = 0;
      const fileStream = createReadStream(path, { start, end });
      let responseStream: Readable = fileStream;

      let compressed = '';
      if (compress && this.getHeader('Accept-Encoding'))
        for (const type of compressPriority) {
          if (this.getHeader('Accept-Encoding').indexOf(type) > -1) {
            compressed = type;
            const compressor = compressors[type as 'br' | 'deflate' | 'gzip']();
            fileStream.pipe(compressor);
            responseStream = compressor;
            this.writeHeader('Content-Encoding', type);
            break;
          }
        }
      responseStream.on('data', (data: Buffer) => this.write(data));
      responseStream.on('end', () => this.end());
      responseStream.on('error', () => {
        this.writeStatus(500);
        this.end();
        responseStream.destroy();
      });

      this.on('aborted', () => responseStream.destroy());
    } catch (e) {
      this.writeStatus(500);
      this.end();
    }
  }

  public end(chunk?: ResponseType) {
    if (this.isAborted) return;
    if (chunk === undefined) this.response.end();
    else this.response.end(this.toRecognizeableString(chunk));
  }

  public redirect(location: string, code = 301) {
    this.writeStatus(301);
    this.writeHeader('Location', location);
    this.end();
  }

  private loadRefs() {
    const regex = /\:([a-zA-Z]*)/gm;
    this.refs = {};
    let i = 0;
    let m = regex.exec(this.path);
    while (m !== null) {
      this.refs[m[1]] = this.request.getParameter(i++);
      m = regex.exec(this.path);
    }
  }

  private toRecognizeableString(chunk: ResponseType) {
    if (typeof chunk === 'string') return chunk;
    if (ArrayBuffer.isView(chunk)) return chunk;
    if (typeof chunk[Symbol.iterator] === 'function') return new Uint8Array(chunk);
    return '';
  }
}
