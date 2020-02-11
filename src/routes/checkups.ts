import { parseExpression } from 'cron-parser';

import { query } from '../db';
import { assertAuthenticated } from '../session';

export async function index () {
    assertAuthenticated();

    const { rows } = await query`
        select * from "scheduledCheckups"
        where "userId"=${req.userId}
    `;

    res.send({ json: rows });
}

function assertCreatePayload (payload): asserts payload is { url: string; crontab: string } {
    if (typeof payload['url'] !== 'string')     throw new Error('Bad Request');
    if (typeof payload['crontab'] !== 'string') throw new Error('Bad Request');
}

export async function create () {
    assertAuthenticated();
    assertCreatePayload(req.json);

    const { url, crontab } = req.json;
    const nextRunDueAt     = parseExpression(crontab).next().toISOString();

    const { rows: [ row ] } = await query`
        insert into "scheduledCheckups"(url, crontab, "nextRunDueAt", "userId")
        values (${url}, ${crontab}, ${nextRunDueAt}, ${req.userId})
        returning *
    `;

    res.send({ status: 201, json: row });
};

export async function show (id : string) {
    assertAuthenticated();

    const { rows: [ row ] } = await query`
        select * from "scheduledCheckups"
        where id=${id}
    `;

    if (!row)                                          throw new Error('Not Found');
    if (row.userId !== req.userId) throw new Error('Unauthorized');

    res.send({ json: row });
};
