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

            const [ outboundCheckup ] = await trx.query`
                select * from "outboundCheckups"
                where "nextRunDueAt" <= now()
                for update skip locked
                limit 1
            `;

            if (!outboundCheckup) {
                trx.commit();
                await sleep(1000);
                continue;
            };

            log({ message: "running outbound checkup", outboundCheckup });

            const res = await fetch(outboundCheckup.url);

            const ranAt = new Date();
            const [ insertedStatus ] = await trx.query`
                insert into "outboundCheckupStatuses" ("outboundCheckupId", "dueAt", "ranAt", status)
                values (${outboundCheckup.id}, ${outboundCheckup.nextRunDueAt}, ${ranAt.toISOString()}, ${res.status})
                returning id
            `;

            log({ message: 'successfully ran outbound  checkup', outboundCheckupId: outboundCheckup.id, dueAt: outboundCheckup.dueAt, ranAt });

            await trx.query`
                insert into tasks ("name", "payload", "status")
                values ('maybeSendAlerts', ${
                    JSON.stringify({ scheduledCheckupStatusId: insertedStatus.id })
                }, 'queued')
            `;

            const nextRunDueAt = parseExpression(outboundCheckup.crontab).next().toISOString();
            await trx.query`
                update "outboundCheckups"
                set "nextRunDueAt" = ${nextRunDueAt}
                where id = ${outboundCheckup.id}
            `;

            await trx.commit();

            await sleep(1000);
        } catch (e) {
            console.error(e);
        }
    }
}

main();
