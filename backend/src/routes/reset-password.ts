import { isEmail } from '../util';
import { randomBytes, createHmac } from 'crypto';

const TOKEN_SIZE = 128;
const TTL = 1000 * 60 * 60;

function assertPayload (payload): asserts payload is { email : string } {
    if (payload.email && !isEmail(payload.email)) throw new Error('Bad Request');
}

export async function create () {
    assertPayload(req.json);

    const token = randomBytes(TOKEN_SIZE);
    const expiresAt = new Date(Date.now() + TTL).toUTCString();

    const hmac = createHmac('sha256', process.env.SECRET);
    hmac.update(token);
    const signature = hmac.digest();


    // await query`
    //     insert into "resetPasswordToken" ("email", "token", "expiresAt")
    //     values (${userId}, ${token.toString('hex')}, ${expiresAt})
    // `;


    // const signedToken = Buffer.concat([
    //     token,
    //     signature
    // ], token.length + signature.length);

    // return {
    //     token: signedToken.toString('hex'),
    //     expiresAt
    // };
}
