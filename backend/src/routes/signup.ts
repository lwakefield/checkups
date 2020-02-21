import * as bcrypt from 'bcrypt';

import { transaction } from '../db';
import { isEmail } from '../util';
import { createSession } from '../session';

function assertCreatePayload (payload): asserts payload is { email: string; password: string } {
    if (!isEmail(payload['email']))              throw new Error('Bad Request');
    if (typeof payload['password'] !== 'string') throw new Error('Bad Request');
    if (payload['password'].length < 10)         throw new Error('Bad Request');
}

export async function create () {
    assertCreatePayload(req.json);

    const trx = await transaction();

    const passwordHash = await bcrypt.hash(req.json.password, 14);
    const [ user ]  = await trx.query`
        insert into users (email, "passwordHash")
        values (${req.json.email}, ${passwordHash})
        returning *
    `;

    const { token, expiresAt } = await createSession(user.id, trx.query);

    await trx.commit();

    res.send({
        status: 201,
        headers: { 'Set-Cookie': `sessionToken=${token}; Expires=${expiresAt}; Path=/` },
    });
}
