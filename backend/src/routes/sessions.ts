import { query } from '../db';
import { isEmail, checkPassword } from '../util';
import { createSession, invalidateSession } from '../session';

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

    await checkPassword(req.json.password, user.passwordHash)

    const { token, expiresAt } = await createSession(user.id);

    res.send({
        status: 201,
        headers: { 'Set-Cookie': `sessionToken=${token}; Expires=${expiresAt}; Path=/` },
    });
}

export async function destroy () {
    await invalidateSession(req.cookies.sessionToken);

    const expiredAt = new Date(Date.now() - 60 * 1000).toUTCString();

    res.send({
        status: 204,
        headers: { 'Set-Cookie': `sessionToken=${req.cookies.sessionToken}; Expires=${expiredAt}; Path=/` },
    });
}
