import { randomBytes, createHmac } from 'crypto';

import * as db from './db';
import { sign, checkSignature } from './util';

const TOKEN_SIZE = 128;

export function assertAuthenticated () {
    if (!req.isAuthenticated) throw new Error('Unauthorized');
}

export async function createSession (userId : string, query = db.query) {
    const token = randomBytes(TOKEN_SIZE);
    const expiresAt = new Date(Date.now() + (1000 * 60 * 60 * 24 * 30)).toUTCString();

    await query`
        insert into sessions ("userId", "token", "expiresAt")
        values (${userId}, ${token.toString('hex')}, ${expiresAt})
    `;

    const signedToken = sign(token);

    return {
        token: signedToken.toString('hex'),
        expiresAt
    };
}

export async function invalidateSession (signedToken : string) {
    checkSignature(signedToken);
    const token = Buffer.from(signedToken, 'hex').slice(0, TOKEN_SIZE);

    await db.query`
        update sessions
        set valid=false
        where token=${token.toString('hex')}
    `;
}

export async function getVerifiedUserIdForSession (signedToken : string) {
    checkSignature(signedToken);
    const token = Buffer.from(signedToken, 'hex').slice(0, TOKEN_SIZE);

    const [ session ] = await db.query`
        select * from sessions
        where
            token=${token.toString('hex')}
            and now() < "expiresAt"
            and valid = true
    `;

    if (!session) {
        throw new Error('Invalid or expired session');
    }

    return session.userId;
}
