import { query } from '../db';
import { isEmail, hashPassword, checkPassword } from '../util';
import { log } from '../log';
import { BadRequest } from '../errors';
import { assertAuthenticated } from '../session';

function assertPayload (payload): asserts payload is {
    email?: string;
    newPassword?: string;
    password?: string;
} {
    if (payload.email && typeof payload.password === 'string' && isEmail(payload.email)) return;
    if (payload.newPassword && typeof payload.password === 'string')                     return;

    throw new BadRequest();
}

export async function update () {
    assertAuthenticated();
    assertPayload(req.json);

    const { password, newPassword, email } = req.json;

    const [ user ] = await query`
        select * from users where id=${req.userId}
    `;

    await checkPassword(password, user.passwordHash);

    if (email) {
        log({
            message: "updating email",
            userId: user.id,
            oldEmail: user.email,
            newEmail:email
        });
        await query`
            update users
            set email=${email}
            where id=${req.userId}
        `;

        return res.send({ });
    }

    if (newPassword &&password) {
        log({
            message: "updating password",
            userId: user.id,
        });
        const passwordHash = await hashPassword(newPassword);
        await query`
            update users
            set "passwordHash"=${passwordHash}
            where id=${req.userId}
        `;

        return res.send({ });
    }
}
