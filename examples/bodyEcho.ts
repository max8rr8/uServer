/* 
curl --header "Content-Type: application/json" \
--request POST \
--data '{"test":"xyz","test2":"zyx"}' \
http://localhost:8000/
*/

import { Server } from '..';

let server = new Server();

server.http('POST', '/*', async ctx => {
  let body = await ctx.readBody();

  ctx.end(body);
});

server.listen(8000, () => 0);
