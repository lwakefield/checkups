import * as fetch from 'node-fetch';
import { parseExpression } from 'cron-parser';
import * as nodemailer from 'nodemailer';

import { init, transaction, query } from './db';

function sleep (ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

const transporter = nodemailer.createTransport(process.env.SMTP_URI);

async function main () {
    await init();

    while (true) {
        try {
            const trx = await transaction();

            const { rows: [ checkup ] } = await trx.query`
                select * from "scheduledCheckups"
                where "nextRunDueAt" <= now()
                for update skip locked
                limit 1
            `;

            if (!checkup) {
                trx.commit();
                continue;
            };

            console.log(`Handling ${JSON.stringify(checkup)}`);

            const res = await fetch(checkup.url);

            if (res.status !== 200) {
                await maybeSendFailureNotification(checkup);
            } else {
                await maybeSendResolvedNotification(checkup);
            }

            await trx.query`
                insert into "scheduledCheckupStatuses" ("scheduledCheckupId", "dueAt", status)
                values (${checkup.id}, ${checkup.nextRunDueAt}, ${res.status})
            `;

            const nextRunDueAt = parseExpression(checkup.crontab).next().toISOString();
            await trx.query`
                update "scheduledCheckups"
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

// TODO: move to worker
async function maybeSendFailureNotification (checkup) {
    const { rows: [ lastStatus ] } = await query`
        select * from "scheduledCheckupStatuses"
        where "scheduledCheckupId"=${checkup.id}
        order by id desc
        limit 1
    `;
    if (lastStatus?.status !== 200) {
        // last run was a failure, don't notify again
        return;
    }

    const { rows: [ user ] } = await query`
        select * from users
        where id=${checkup.userId}
    `;

    await transporter.sendMail({
        from: 'alerts@checkups.dev',
        to: user.email,
        subject: `[FAILURE] ${checkup.url} failed it's checkup`,
        text: `Just letting you know that ${
            checkup.url
        } failed it's checkup scheduled for ${
            checkup.nextRunDueAt.toISOString()
        }.`
    });
}

async function maybeSendResolvedNotification (checkup) {
    const { rows: [ lastStatus ] } = await query`
        select * from "scheduledCheckupStatuses"
        where "scheduledCheckupId"=${checkup.id}
        order by id desc
        limit 1
    `;
    if (lastStatus?.status === 200) {
        // last run was a success, this checkup was not "resolved"
        return;
    }

    const { rows: [ user ] } = await query`
        select * from users
        where id=${checkup.userId}
    `;

    await transporter.sendMail({
        from: 'alerts@checkups.dev',
        to: user.email,
        subject: `[RESOLVED] ${checkup.url} has resolved`,
        text: `Just letting you know that the checkup scheduled at ${
            checkup.nextRunDueAt.toISOString()
        } for ${
            checkup.url
        } has resolved.`
    });
}

main();
