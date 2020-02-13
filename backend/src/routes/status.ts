import { db, query } from '../db';

const MAX_INT_64 = 2147483647

export async function index () {
    const {
        checkupId,
        beforeId = MAX_INT_64,
        offset = 0,
        limit = 20,
        order="desc"
    } = req.query as any;

    if (!checkupId) { throw new Error('Bad Request'); }

    const baseQuery = query`
        select "scheduledCheckupStatuses".*, "scheduledCheckups"."userId"
        from "scheduledCheckupStatuses", "scheduledCheckups"
        where
            "scheduledCheckups"."id"=${checkupId}
            and "scheduledCheckupId"=${checkupId}
    `;

    const { rows: statuses } = await query`
        select * from (${baseQuery}) q
        where q.id < ${beforeId}
        order by "dueAt" ${db.raw(order)}
        limit ${db.raw(limit)} offset ${offset}
    `;


    if (statuses[0]?.userId !== req.userId) throw new Error('Unauthorized');

    const { rows: [ { count } ]} = await query`
        select count(*) from (${baseQuery}) q
    `;

    const { rows: [first, last] } = await query`
        (select id from (${baseQuery}) q order by "dueAt" desc limit 1)
        union
        (select id from (${baseQuery}) q order by "dueAt" asc limit 1)
    `;

    console.log(count);

    res.send({
        json: statuses.map(({ userId, ...row }) => row),
            headers: {
            'x-first-id': first.id,
            'x-last-id': last.id,
            'x-total-count': count,
        }
    });
}
