import { randomBytes } from 'crypto';

import * as bcrypt from 'bcrypt';

import { transaction } from '../db';
import { isEmail } from '../util';

function assertCreatePayload (payload): asserts payload is { email: string; password: string } {
    if (!isEmail(req.json['email']))              throw new Error('Bad Request');
    if (typeof req.json['password'] !== 'string') throw new Error('Bad Request');
    if (req.json['password'].length < 10)         throw new Error('Bad Request');
}

export async function create () {
    assertCreatePayload(req.json);

    const trx = await transaction();

    const passwordHash = await bcrypt.hash(req.json.password, 14);
    const { rows: [ user ] } = await trx.query`
        insert into users (email, "passwordHash")
        values (${req.json.email}, ${passwordHash})
        returning *
    `;

    const token = randomBytes(64).toString('hex');
    const expiresAt = new Date(Date.now() + (1000 * 60 * 60 * 24 * 30)).toISOString();
    await trx.query`
        insert into sessions ("userId", "token", "expiresAt")
        values (${user.id}, ${token}, ${expiresAt})
    `;
    await trx.commit();

    res.send({
        status: 201,
        headers: { 'Set-Cookie': `sessionToken=${token}; Expires=${expiresAt}` },
    });
}
