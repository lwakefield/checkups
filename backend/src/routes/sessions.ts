import { randomBytes } from 'crypto';

import * as bcrypt from 'bcrypt';

import { query } from '../db';
import { isEmail } from '../util';

function assertCreatePayload (payload): asserts payload is { email: string; password: string } {
    if (!isEmail(req.json['email']))              throw new Error('Bad Request');
    if (typeof req.json['password'] !== 'string') throw new Error('Bad Request');
}

export async function create () {
    assertCreatePayload(req.json);

    const [ user ] = await query`
        select * from users
        where email=${req.json.email}
    `;

    if (!user) throw new Error('Unauthorized');

    const match = await bcrypt.compare(req.json.password, user.passwordHash);

    if (!match) throw new Error('Unauthorized');

    const token = randomBytes(64).toString('hex');
    const expiresAt = new Date(Date.now() + (1000 * 60 * 60 * 24 * 30)).toUTCString();
    await query`
        insert into sessions ("userId", "token", "expiresAt")
        values (${user.id}, ${token}, ${expiresAt})
    `;

    res.send({
        status: 201,
        headers: { 'Set-Cookie': `sessionToken=${token}; Expires=${expiresAt}; Path=/` },
    });
}

export async function destroy () {
    await query`
        update sessions
        set valid=false
        where token=${req.cookies.sessionToken}
    `;
    const expiredAt = new Date(Date.now() - 60 * 1000).toUTCString();

    res.send({
        status: 204,
        headers: { 'Set-Cookie': `sessionToken=${req.cookies.sessionToken}; Expires=${expiredAt}; Path=/` },
    });
}
