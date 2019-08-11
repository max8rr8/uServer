// curl http://localhost:8000/

import { Server } from '..';

let server = new Server();

server.http('GET', '/*', async ctx => {
  ctx.end('Hello world!');
});

server.listen(8000, () => 0);
