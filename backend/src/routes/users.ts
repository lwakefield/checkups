import { query } from '../db';
import { isEmail, checkSignature, hashPassword, checkPassword } from '../util';
import { log } from '../log';

function assertPayload (payload): asserts payload is {
    email?: string;
    newPassword?: string;
    password?: string;
} {

    if (payload.email && typeof payload.password === 'string' && isEmail(payload.email)) return;
    if (payload.newPassword && typeof payload.password === 'string')                     return;

    throw new Error('Bad Request');
}

export async function update () {
    if (!req.isAuthenticated) throw new Error('Unauthorized');

    const payload = req.json;
    assertPayload(payload);

    const [ user ] = await query`
        select * from users where id=${req.userId}
    `;

    await checkPassword(payload.password, user.passwordHash);

    if (payload.email) {
        log({
            message: "updating email",
            userId: user.id,
            oldEmail: user.email,
            newEmail: payload.email
        });
        await query`
            update users
            set email=${payload.email}
            where id=${req.userId}
        `;

        return res.send({ });
    }

    if (payload.newPassword && payload.password) {
        log({
            message: "updating password",
            userId: user.id,
        });
        const passwordHash = await hashPassword(payload.newPassword);
        await query`
            update users
            set "passwordHash"=${passwordHash}
            where id=${req.userId}
        `;

        return res.send({ });
    }
}
