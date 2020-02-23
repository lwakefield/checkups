import { transaction } from '../db';
import { isEmail, hashPassword } from '../util';
import { createSession } from '../session';
import { BadRequest } from '../errors';

function assertCreatePayload (payload): asserts payload is { email: string; password: string } {
    if (!isEmail(payload['email']))              throw new BadRequest();
    if (typeof payload['password'] !== 'string') throw new BadRequest();
    if (payload['password'].length < 10)         throw new BadRequest();
}

export async function create () {
    assertCreatePayload(req.json);

    const trx = await transaction();

    const passwordHash = await hashPassword(req.json.password)
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
