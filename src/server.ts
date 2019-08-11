import { Router, RouteRecord } from './router';
import { App, TemplatedApp } from 'uWebSockets.js';

type HttpMethodUWS = 'any' | 'connect' | 'del' | 'get' | 'head' | 'options' | 'patch' | 'post' | 'put' | 'trace';

export class Server extends Router {
  public app: TemplatedApp;

  constructor() {
    super();
    this.app = App();
  }

  public registerRoute(route: RouteRecord) {
    if (route[0] === 'WS') {
      this.app.ws(route[1], route[2]);
    } else {
      this.app[route[0].toLowerCase() as HttpMethodUWS](route[1], route[2]);
    }
  }

  public listen(port: number, callback: () => void) {
    this.app.listen(port, callback);
  }
}
