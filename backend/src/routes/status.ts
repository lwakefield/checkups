import { db, query } from '../db';

export async function index () {
    const { id, offset = 0, limit = 20, order="desc" } = req.query as any;

    if (!id) { throw new Error('Bad Request'); }

    const { rows } = await query`
        select "scheduledCheckupStatuses".*, "scheduledCheckups"."userId"
        from "scheduledCheckupStatuses", "scheduledCheckups"
        where
            "scheduledCheckups"."id"=${id}
            and "scheduledCheckupId"=${id}
        order by "dueAt" ${db.raw(order)}
        limit ${db.raw(limit)} offset ${offset}
    `;

    if (rows[0]?.userId !== req.userId) throw new Error('Unauthorized');

    res.send({ json: rows.map(({ userId, ...row }) => row) });
}
