import { parseExpression } from 'cron-parser';

import { query } from '../db';
import { assertAuthenticated } from '../session';
import {groupBy} from '../util';

export async function index () {
    assertAuthenticated();

    const checkups = await query`
        select * from "scheduledCheckups"
        where "userId"=${req.userId}
    `;

    const statuses = await query`
        with "checkupsByAge" as (
            select
                *,
                rank() over (partition by "scheduledCheckupId" order by id desc)
            from "scheduledCheckupStatuses"
            where
                "scheduledCheckupId" = any(${checkups.map(v => v.id)})
        )
        select * from "checkupsByAge" where rank <= 5
    `;

    const statusesGroupedByCheckup = groupBy(statuses, v => v.scheduledCheckupId);

    for (const checkup of checkups) {
        Object.assign(checkup, { recentStatuses: statusesGroupedByCheckup[checkup.id] || [] });
    }

    res.send({ json: checkups });
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

    const [ checkup ] = await query`
        insert into "scheduledCheckups"(url, crontab, "nextRunDueAt", "userId")
        values (${url}, ${crontab}, ${nextRunDueAt}, ${req.userId})
        returning *
    `;

    res.send({ status: 201, json: checkup });
};

export async function show (id : string) {
    assertAuthenticated();

    const [ checkup ] = await query`
        select * from "scheduledCheckups"
        where id=${id}
    `;

    if (!checkup)                      throw new Error('Not Found');
    if (checkup.userId !== req.userId) throw new Error('Unauthorized');

    const recentStatuses = await query`
        select * from "scheduledCheckupStatuses"
        where "scheduledCheckupId"=${id}
        order by id desc
        limit 5
    `;

    Object.assign(checkup, { recentStatuses });

    res.send({ json: checkup });
};
