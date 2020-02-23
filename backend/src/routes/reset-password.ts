import { isEmail, checkSignature, getPayloadFromSignedValue, hashPassword } from '../util';
import { query, transaction } from '../db';
import { log } from '../log';
import { createSession } from '../session';
import { BadRequest } from '../errors';

function assertCreatePayload (payload): asserts payload is { email : string } {
    if (payload.email && !isEmail(payload.email)) throw new BadRequest();
}

export async function create () {
    assertCreatePayload(req.json);

    const [ user ] = await query`
        select id from users
        where email=${req.json.email}
    `;

    if (!user) {
        log({ message: 'Requested reset password for non-existent user', payload: req.json });
        // We return 200 to avoid leaking information about whether the account
        // exists
        return res.send({});
    }

    await query`
        insert into tasks (name, payload, status)
        values ('sendResetPasswordEmail', ${JSON.stringify({ userId: user.id })}, 'queued')
    `;

    res.send({});
}

function assertUpdatePayload (payload): asserts payload  is { token : string; password: string; } {
    if (typeof payload.token !== 'string')    throw new BadRequest();
    if (typeof payload.password !== 'string') throw new BadRequest();
}

export async function update () {
    assertUpdatePayload(req.json);
    checkSignature(req.json.token)

    const trx = await transaction();

    const token = getPayloadFromSignedValue(req.json.token).toString('hex');

    const [ user ] = await trx.query`
        select users.*
        from users, "resetPasswordTokens"
        where
            "resetPasswordTokens"."userId" = users.id
            and "resetPasswordTokens"."token" = ${token}
            and "resetPasswordTokens"."expiresAt" > now()
            and "resetPasswordTokens".valid = true
    `;

    if (!user) throw new BadRequest();

    log({
        message: "resetting password with token",
        userId: user.id,
    });

    const passwordHash = await hashPassword(req.json.password);
    await trx.query`
        update users
        set "passwordHash"=${passwordHash}
        where id=${user.id}
    `;
    await trx.query`
        update "resetPasswordTokens"
        set valie=false
        where token=${token}
    `;

    const session = await createSession(user.id, trx.query);

    await trx.commit();

    res.send({
        status: 200,
        headers: { 'Set-Cookie': `sessionToken=${session.token}; Expires=${session.expiresAt}; Path=/` },
    });
}
