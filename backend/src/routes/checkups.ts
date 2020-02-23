import { parseExpression } from 'cron-parser';

import { query } from '../db';
import { assertAuthenticated } from '../session';
import { groupBy } from '../util';
import { BadRequest, Unauthorized, NotFound } from '../errors';

function assertIndexQuery (query): asserts query is {
    type: 'inbound' | 'outbound';
} {
    const conditions = [
        ['inbound', 'outbound'].includes(query['type'])
    ];

    if (false === conditions.every(Boolean)) throw new BadRequest();
}

export async function index () {
    assertAuthenticated();
    assertIndexQuery(req.query);

    const checkups = await query`
        select * from "checkups"
        where "userId"=${req.userId} and type=${req.query.type}
        order by id desc
    `;

    const statuses = await query`
        with "checkupsByAge" as (
            select
                *,
                rank() over (partition by "checkupId" order by id desc)
            from "checkupStatuses"
            where
                "checkupId" = any(${checkups.map(v => v.id)})
        )
        select * from "checkupsByAge" where rank <= 5
    `;

    const statusesGroupedByCheckup = groupBy(statuses, v => v.checkupId);

    for (const checkup of checkups) {
        Object.assign(checkup, { recentStatuses: statusesGroupedByCheckup[checkup.id] || [] });
    }

    res.send({ json: checkups });
}

function assertCreatePayload (payload): asserts payload is {
    url: string;
    crontab: string;
    type: 'inbound' | 'outbound';
} {
    const conditions = [
        typeof payload['url'] === 'string',
        typeof payload['crontab'] === 'string',
        ['inbound', 'outbound'].includes(payload['type'])
    ]

    if (false === conditions.every(Boolean)) throw new BadRequest();
}

export async function create () {
    assertAuthenticated();
    assertCreatePayload(req.json);

    const { type, url, crontab } = req.json;
    const nextRunDueAt     = parseExpression(crontab).next().toISOString();

    if (type === 'outbound') {
        const [ checkup ] = await query`
            insert into "checkups"(type, url, crontab, "nextRunDueAt", "userId")
            values (${type}, ${url}, ${crontab}, ${nextRunDueAt}, ${req.userId})
            returning *
        `;
        res.send({ status: 201, json: checkup });
    } else if (type === 'inbound') {
        throw new Error('Not Implmented');
    } else {
        throw new Error('Not Implmented');
    }
};


export async function show (id : string) {
    assertAuthenticated();

    const [ checkup ] = await query`
        select * from "checkups"
        where id=${id}
    `;

    if (!checkup)                      throw new NotFound();
    if (checkup.userId !== req.userId) throw new Unauthorized();

    const recentStatuses = await query`
        select * from "checkupStatuses"
        where "checkupId"=${id}
        order by id desc
        limit 5
    `;

    Object.assign(checkup, { recentStatuses });

    res.send({ json: checkup });
};
