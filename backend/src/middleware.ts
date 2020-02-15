import { randomBytes } from 'crypto';
import { STATUS_CODES } from 'http';

import { query } from './db';

export async function before () {
    req.requestId = randomBytes(16).toString('hex');
    console.log(`${new Date().toISOString()} ${req.requestId} -> ${req.method} ${req.url}`);

    req.cookies = getCookies(req.headers['cookie'] ?? '');

    if (req.cookies.sessionToken) {
        const [ user ] = await query`
            select * from sessions
            where
            token=${req.cookies.sessionToken}
            and now() < "expiresAt"
        `;

        req.userId          = user?.userId ?? null;
        req.isAuthenticated = Boolean(user?.userId);
    }

    res.headers['Access-Control-Allow-Credentials'] = 'true';
    res.headers['Access-Control-Allow-Origin'] = req.headers['origin'] || '';
};

function getCookies (cookieStr : string) {
    return cookieStr
        .split('; ')
        .filter(Boolean)
        .map((v : string) => v.split('='))
        .reduce((acc, [key, val]) => Object({
            ...acc,
            [key]: val
        }), {});
}

export function after () {
    console.log(`${new Date().toISOString()} ${req.requestId} <- ${req.method} ${req.url}`);
 };

const STATUS_TO_CODES = Object.entries(STATUS_CODES)
    .reduce(
        (acc, [key, val]) => Object({ ...acc, [val]: key }),
        {},
    );

export function error (e) {
    if (STATUS_TO_CODES[e.message]) {
        const status = STATUS_TO_CODES[e.message];

        if (status >= 500 && status <= 599) {
            console.error(e);
        }

        res.send({ status, body: e.message });
    } else {
        console.error(e);
        res.send({ status: 500 });
    }

    console.log(`${new Date().toISOString()} ${req.requestId} <- ${req.method} ${req.url}`);
}
