import { isEmail } from '../util';
import { query } from '../db';
import { log } from '../log';

function assertPayload (payload): asserts payload is { email : string } {
    if (payload.email && !isEmail(payload.email)) throw new Error('Bad Request');
}

export async function create () {
    assertPayload(req.json);

    console.log(req.json.email);

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
