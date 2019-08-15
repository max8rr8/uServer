import { HttpRequest, HttpResponse, WebSocketBehavior } from 'uWebSockets.js';
import { Ctx } from './http';

type httpMethod = 'ANY' | 'CONNECT' | 'DEL' | 'GET' | 'HEAD' | 'OPTIONS' | 'PATCH' | 'POST' | 'PUT' | 'TRACE';

type RouteRecordHttp = [httpMethod, string, (res: HttpResponse, req: HttpRequest) => void];
// type RouteRecordWS = ['WS', string, WebSocketBehavior];

type RouteRecord = RouteRecordHttp; // | RouteRecordWS;

export class Router {
  public routes: RouteRecord[] = [];

  public registerRoute(route: RouteRecord) {
    this.routes.push(route);
  }

  public registerIn(path: string, router: Router) {
    this.routes.forEach(e => {
      router.registerRoute([e[0], path + e[1], e[2]] as RouteRecord);
    });
  }

  public connect(path: string, router: Router) {
    router.registerIn(path, this);
  }

  public http(method: httpMethod, path: string, callback: (ctx: Ctx) => void) {
    this.registerRoute([method, path, (res: HttpResponse, req: HttpRequest) => callback(new Ctx(req, res, path))]);
  }
}

export { RouteRecord, httpMethod };
