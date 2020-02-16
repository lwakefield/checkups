import * as fetch from 'node-fetch';
import { parseExpression } from 'cron-parser';

import { init, transaction, } from '../db';
import { log } from '../log';
import { sleep } from '../util';

async function main () {
    await init();

    while (true) {
        try {
            const trx = await transaction();

            const [ checkup ] = await trx.query`
                select * from "checkups"
                where "nextRunDueAt" <= now()
                for update skip locked
                limit 1
            `;

            if (!checkup) {
                trx.commit();
                await sleep(1000);
                continue;
            };

            log({ message: "running checkup", checkup });

            const res = await fetch(checkup.url);

            const [ insertedStatus ] = await trx.query`
                insert into "checkupStatuses" ("checkupId", "dueAt", "ranAt", status)
                values (${checkup.id}, ${checkup.nextRunDueAt}, ${new Date().toISOString()}, ${res.status})
                returning id
            `;

            await trx.query`
                insert into tasks ("name", "payload", "status")
                values ('maybeSendAlerts', ${
                    JSON.stringify({ scheduledCheckupStatusId: insertedStatus.id })
                }, 'queued')
            `;

            const nextRunDueAt = parseExpression(checkup.crontab).next().toISOString();
            await trx.query`
                update "checkups"
                set "nextRunDueAt" = ${nextRunDueAt}
                where id = ${checkup.id}
            `;

            await trx.commit();

            await sleep(1000);
        } catch (e) {
            console.error(e);
        }
    }
}

main();
