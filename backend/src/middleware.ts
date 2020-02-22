import { randomBytes } from 'crypto';
import { STATUS_CODES } from 'http';

import { query } from './db';
import { log } from './log';
import { getVerifiedUserIdForSession } from './session';

export async function before () {
    req.requestId = randomBytes(16).toString('hex');
    log({
        message: "inbound request",
        requestId: req.requestId,
        method: req.method,
        url: req.url,
    });

    req.cookies = getCookies(req.headers['cookie'] ?? '');

    if (req.cookies.sessionToken) {
        try {
            req.userId = await getVerifiedUserIdForSession(req.cookies.sessionToken);
            req.isAuthenticated = Boolean(req.userId);
        } catch(e)  {
            // TODO
        }
    }
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
    log({
        message: "outbound response",
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        status: res.status
    });
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

    log({
        message: "outbound response",
        error: e,
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        status: res.status
    });
}
