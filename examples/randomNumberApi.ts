// curl http://localhost:8000/num/0/10?delay=3

import { Server } from '..';

let server = new Server();

let pause = (time: number) => new Promise(resolve => setTimeout(resolve, time));

server.http('GET', '/num/:min/:max', async ctx => {
  let delay = ctx.getQuery()['delay'];
  if (delay) await pause(parseInt(delay) * 1000);
  let min = parseInt(ctx.getRef('min'));
  let max = parseInt(ctx.getRef('max'));
  ctx.end(Math.round(Math.random() * (max - min) + min).toString());
});

server.listen(8000, () => 0);
