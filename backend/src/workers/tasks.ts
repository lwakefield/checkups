import * as nodemailer from 'nodemailer';

import { init, transaction, query } from '../db';
import { log } from '../log';
import { sleep } from '../util';
import {randomBytes, createHmac} from 'crypto';

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
        select * from "checkupStatuses"
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

    const [ checkup ] = await query`
        select "checkups".* from "checkups", "checkupStatuses"
        where "checkupStatuses"."checkupId" = "checkups".id
            and "checkupStatuses".id = ${scheduledCheckupStatusId}
    `;

    const [ user ] = await query`
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
        insert into "resetPasswordTokens" ("userId", "token", "expiresAt")
        values (${user.id}, ${token.toString('hex')}, ${expiresAt})
    `;

    const hmac = createHmac('sha256', process.env.SECRET);
    hmac.update(token);
    const signature = hmac.digest();

    const signedToken = Buffer.concat([
        token,
        signature
    ], token.length + signature.length);

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
