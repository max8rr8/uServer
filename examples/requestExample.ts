// curl 'localhost:8000/users/max/parameters/normal?test=ok'

import { Server } from '..';

let server = new Server();

server.http('ANY', '/users/:user/parameters/:parameter', ctx => {
  ctx.write(ctx.getMethod() + ' ' + ctx.getUrl() + '\n');
  ctx.write(ctx.getRef('user') + ' ' + ctx.getRef('parameter') + '\n\n');

  let query = ctx.getQuery();
  for (let i in query) {
    ctx.write(`${i}: ${query[i]}\n`);
  }
  ctx.write('\n');

  let headers = ctx.getHeaders();
  for (let i in headers) {
    ctx.write(`${i}: ${headers[i]}\n`);
  }

  ctx.end('\nYou are using: ' + ctx.getHeader('User-Agent'));
});
server.listen(8000, () => 0);
