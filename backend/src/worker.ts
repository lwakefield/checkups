import * as fetch from 'node-fetch';
import { parseExpression } from 'cron-parser';

import { init, transaction } from './db';

function sleep (ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main () {
    await init();

    while (true) {
        try {
            const trx = await transaction();

            const { rows: [ row ] } = await trx.query`
            select * from "scheduledCheckups"
            where "nextRunDueAt" <= now()
            for update skip locked
                limit 1
            `;

            if (!row) {
                trx.commit();
                continue;
            };

            console.log(`Handling ${JSON.stringify(row)}`);

            const res = await fetch(row.url);

            await trx.query`
            insert into "scheduledCheckupStatuses" ("scheduledCheckupId", "dueAt", status)
            values (${row.id}, ${row.nextRunDueAt}, ${res.status})
            `;

            const nextRunDueAt = parseExpression(row.crontab).next().toISOString();
            await trx.query`
            update "scheduledCheckups"
            set "nextRunDueAt" = ${nextRunDueAt}
            where id = ${row.id}
            `;

            await trx.commit();

            await sleep(100);
        } catch (e) {
            console.error(e);
        }
    }
}

main();
