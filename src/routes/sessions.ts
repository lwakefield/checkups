import { randomBytes } from 'crypto';

import * as bcrypt from 'bcrypt';

import { query } from '../db';

function assertCreatePayload (payload): asserts payload is { username: string; password: string } {
    if (typeof req.json['username'] !== 'string') throw new Error('Bad Request');
    if (typeof req.json['password'] !== 'string') throw new Error('Bad Request');
}

export async function create () {
    assertCreatePayload(req.json);

    const { rows: [ user ] } = await query`
        select * from users
        where username=${req.json.username}
    `;

    if (!user) throw new Error('Unauthorized');

    const match = await bcrypt.compare(req.json.password, user.passwordHash);

    if (!match) throw new Error('Unauthorized');

    const token = randomBytes(64).toString('hex');
    const expiresAt = new Date(Date.now() + (1000 * 60 * 60 * 24 * 30)).toISOString();
    await query`
        insert into sessions ("userId", "token", "expiresAt")
        values (${user.id}, ${token}, ${expiresAt})
    `;

    res.send({
        status: 201,
        headers: { 'Set-Cookie': `sessionToken=${token}; Expires=${expiresAt}` },
    });
}

export async function destroy () {
    await query`
        update table sessions
        set valid=false
        where token=${req.cookies.sessionToken}
    `;
    res.send({
        status: 204,
        headers: { 'Set-cookie': 'sessionToken=' },
    });
}
