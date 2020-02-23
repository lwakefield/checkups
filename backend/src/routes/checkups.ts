import { parseExpression } from 'cron-parser';

import { query } from '../db';
import { assertAuthenticated } from '../session';
import { groupBy } from '../util';
import { BadRequest, Unauthorized, NotFound } from '../errors';

export async function index () {
    assertAuthenticated();

    const outboundCheckups = await query`
        select * from "outboundCheckups"
        where "userId"=${req.userId}
        order by id desc
    `;

    const statuses = await query`
        with "outboundCheckupsByAge" as (
            select
                *,
                rank() over (partition by "outboundCheckupId" order by id desc)
            from "outboundCheckupStatuses"
            where
                "outboundCheckupId" = any(${outboundCheckups.map(v => v.id)})
        )
        select * from "outboundCheckupsByAge" where rank <= 5
    `;

    const statusesGroupedByCheckup = groupBy(statuses, v => v.outboundCheckupId);

    for (const outboundCheckup of outboundCheckups) {
        Object.assign(outboundCheckup, { recentStatuses: statusesGroupedByCheckup[outboundCheckup.id] || [] });
    }

    res.send({ json: outboundCheckups });
}

function assertCreatePayload (payload): asserts payload is { url: string; crontab: string } {
    if (typeof payload['url'] !== 'string')     throw new BadRequest();
    if (typeof payload['crontab'] !== 'string') throw new BadRequest();
}

export async function create () {
    assertAuthenticated();
    assertCreatePayload(req.json);

    const { url, crontab } = req.json;
    const nextRunDueAt     = parseExpression(crontab).next().toISOString();

    const [ outboundCheckup ] = await query`
        insert into "outboundCheckups"(url, crontab, "nextRunDueAt", "userId")
        values (${url}, ${crontab}, ${nextRunDueAt}, ${req.userId})
        returning *
    `;

    res.send({ status: 201, json: outboundCheckup });
};

export async function show (id : string) {
    assertAuthenticated();

    const [ outboundCheckup ] = await query`
        select * from "outboundCheckups"
        where id=${id}
    `;

    if (!outboundCheckup)                      throw new NotFound();
    if (outboundCheckup.userId !== req.userId) throw new Unauthorized();

    const recentStatuses = await query`
        select * from "outboundCheckupStatuses"
        where "outboundCheckupId"=${id}
        order by id desc
        limit 5
    `;

    Object.assign(outboundCheckup, { recentStatuses });

    res.send({ json: outboundCheckup });
};
