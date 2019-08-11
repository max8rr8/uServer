// curl http://localhost:8000/

import { join } from 'path';
import { tmpdir } from 'os';
import { Server } from '..';
import { writeFileSync } from 'fs';

const path = join(tmpdir(), 'test.html');
writeFileSync(path, '<h1>TEST DATA</h1>');

let server = new Server();

server.http('GET', '/*', async ctx => {
  ctx.sendFile(path, { compress: true });
});

server.listen(8000, () => 0);
