import * as nodemailer from 'nodemailer';

import { init, transaction, query } from '../db';
import { log } from '../log';
import { sleep, sign } from '../util';
import {randomBytes, createHmac,} from 'crypto';

const transporter = nodemailer.createTransport(process.env.SMTP_URI);

(async function main () {
    await init();

    while (true) {
        try {
            const trx = await transaction();

            const [ task ] = await trx.query`
                select * from tasks
                where status = 'queued'
                for update skip locked
                limit 1
            `;

            if (!task) {
                trx.commit();
                await sleep(1000);
                continue;
            };

            log({ message: 'processing task', task });

            if (task.name === 'maybeSendAlerts') {
                await maybeSendAlerts(task.payload);
            } else if (task.name === 'sendResetPasswordEmail') {
                await sendResetPasswordEmail(task.payload);
            } else {
                throw new Error(`No handler for ${task.name}`);
            }

            await trx.query`
                update tasks
                set status = 'done'
                where id = ${task.id}
            `;

            await trx.commit();

            log({ message: 'finished processing task', task });

            await sleep(1000);
        } catch (e) {
            console.error(e);
        }
    }
})();

async function maybeSendAlerts ({ scheduledCheckupStatusId }) {
    const [ latest, previous ] = await query`
        select * from "outboundCheckupStatuses"
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

    const [ outboundCheckup ] = await query`
        select "outboundCheckups".* from "outboundCheckups", "outboundCheckupStatuses"
        where "outboundCheckupStatuses"."outboundCheckupId" = "outboundCheckups".id
            and "outboundCheckupStatuses".id = ${scheduledCheckupStatusId}
    `;

    const [ user ] = await query`
        select * from users
        where id=${outboundCheckup.userId}
    `;

    if (latest.status !== 200) {
        await transporter.sendMail({
            from: 'alerts@checkups.dev',
            to: user.email,
            subject: `[FAILURE] ${outboundCheckup.url} failed it's outboundCheckup`,
            text: `Just letting you know that ${
                outboundCheckup.url
            } failed it's outbound checkup scheduled for ${
                outboundCheckup.nextRunDueAt.toISOString()
            }.`
        });
    } else if (latest.status === 200 && previous) {
        await transporter.sendMail({
            from: 'alerts@checkups.dev',
            to: user.email,
            subject: `[RESOLVED] ${outboundCheckup.url} has resolved`,
            text: `Just letting you know that the outbound checkup scheduled at ${
                outboundCheckup.nextRunDueAt.toISOString()
            } for ${
                outboundCheckup.url
            } has resolved.`
        });
    }
}

async function sendResetPasswordEmail ({ userId }) {
    const TOKEN_SIZE = 128;
    const TTL = 1000 * 60 * 60;

    const [ user ] = await query`
        select id, email from users where id=${userId}
    `;

    if (!user) throw new Error('Could not find user');

    const token = randomBytes(TOKEN_SIZE);
    const expiresAt = new Date(Date.now() + TTL).toUTCString();

    const trx = await transaction();
    await trx.query`
        insert into "resetPasswordTokens" ("userId", "token", "expiresAt", "valid")
        values (${user.id}, ${token.toString('hex')}, ${expiresAt}, true)
    `;

    const signedToken = sign(token);

    await transporter.sendMail({
        from: 'resetpassword@checkups.dev',
        to: user.email,
        subject: `Reset Password Request`,
        text: `
We have received a request to reset your password.

If you did not make this request, please reach out to support@checkups.dev.

If you did make this request, please follow this link to reset your
password: ${process.env.SITE_URL}/reset-password?token=${signedToken.toString('hex')}
        `.trim()
    });

    await trx.commit();
}
