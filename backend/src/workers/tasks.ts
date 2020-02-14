import { parseExpression } from 'cron-parser';
import * as nodemailer from 'nodemailer';

import { init, transaction, query } from '../db';
import { log } from '../log';

function sleep (ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

const transporter = nodemailer.createTransport(process.env.SMTP_URI);

(async function main () {
    await init();

    while (true) {
        try {
            const trx = await transaction();

            const { rows: [ task ] } = await trx.query`
                select * from tasks
                where status = 'queued'
                for update skip locked
                limit 1
            `;

            if (!task) {
                trx.commit();
                continue;
            };

            log({ message: 'processing task', task });

            if (task.name === 'maybeSendAlerts') {
                await maybeSendAlerts(task.payload);
            } else {
                throw new Error(`No handler for ${task.name}`);
            }

            await trx.query`
                update tasks
                set status = 'done'
                where id = ${task.id}
            `;

            await trx.commit();

            await sleep(1000);
        } catch (e) {
            console.error(e);
        }
    }
})();

async function maybeSendAlerts ({ scheduledCheckupStatusId }) {
    const { rows: [ latest, previous ] } = await query`
        select * from "scheduledCheckupStatuses"
        where id <= ${scheduledCheckupStatusId}
        order by id desc
        limit 2
    `;

    if (latest.status === 200 && previous.status === 200) {
        log({ message: "no alert required", latest, previous });
        return;
    }

    if (latest.status !== 200 && previous.status !== 200) {
        log({ message: "no alert required", latest, previous });
        return;
    }

    const { rows: [ checkup ] } = await query`
        select "scheduledCheckups".* from "scheduledCheckups", "scheduledCheckupStatuses"
        where "scheduledCheckupStatuses"."scheduledCheckupId" = "scheduledCheckups".id
            and "scheduledCheckupStatuses".id = ${scheduledCheckupStatusId}
    `;

    const { rows: [ user ] } = await query`
        select * from users
        where id=${checkup.userId}
    `;

    if (latest.status !== 200) {
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
    } else if (latest.status === 200 && previous) {
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
}
