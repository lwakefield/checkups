import * as Persea from '@persea/persea';

import { init as dbInit } from './db';

interface Request extends Persea.Request {
  requestId: string;
  cookies: { [key: string]: string };
  isAuthenticated: boolean;
  userId: number | null;
}
interface Response extends Persea.Response {
}

declare global {
  var req : Request;
  var res : Response;
}

export async function init () {
  globalThis.req = Persea.request as Request;
  globalThis.res = Persea.response;

  await dbInit();
}
