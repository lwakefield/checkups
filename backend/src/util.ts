import { createHmac } from "crypto";

import * as bcrypt from 'bcrypt';

const EMAIL_RGX = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

export function isEmail (val): boolean {
    if (typeof val !== 'string') return false;

    return EMAIL_RGX.test(val);
}

export function groupBy (vals, predicate) {
    const res = {};

    for (const val of vals) {
        const id = predicate(val);

        if (res[id] === undefined) res[id] = [];

        res[id].push(val);
    }

    return res;
}

export function sleep (ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function checkSignature (signedVal : string) {
    const buffer    = Buffer.from(signedVal, 'hex');
    const val       = buffer.slice(0, -32);
    const signature = buffer.slice(-32);

    const hmac = createHmac('sha256', process.env.SECRET);
    hmac.update(val);

    const expectedSignature = hmac.digest();

    if (false === expectedSignature.equals(signature)) throw new Error('Invalid signature');
}

export function getPayloadFromSignedValue (signedVal : string) {
    const buffer    = Buffer.from(signedVal, 'hex');
    const val       = buffer.slice(0, -32);
    return val;
}

export function sign (val : Buffer) {
    const hmac = createHmac('sha256', process.env.SECRET);
    hmac.update(val);

    const signature = hmac.digest();

    return Buffer.concat([
        val,
        signature
    ], val.length + signature.length);
}

export function hashPassword (password : string) {
    return bcrypt.hash(password, 14);
}

export async function checkPassword  (password : string, hash : string) {
    const match = await bcrypt.compare(password, hash);

    if (!match) throw new Error('Unauthorized');
}
