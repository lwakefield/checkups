import * as knex from 'knex';
import { parseExpression } from 'cron-parser';

import { query } from '../db';
import { NotFound } from '../errors';

interface Checkup {
	id: number;
	createdAt: string;
	updatedAt: string;
	userId: number;
	type: string;
	url: string;
	crontab: string;
	token: string;
	nextRunDueAt: string;
}
type CheckupWithRecentStatuses = Checkup & {
	recentStatuses: Array<{
		status: number;
		createdAt: string;
	}>;
};

export async function getCheckups (filter : knex.Raw = query`1=1`) {
	return query<Array<CheckupWithRecentStatuses>>`
        select checkups.*, "recentCheckupStatuses"."recentStatuses"
        from "checkups"
        join "recentCheckupStatuses" on "recentCheckupStatuses"."checkupId" = checkups.id

	where ${filter}

        order by id desc
    `;
}

export async function getAllCheckupsForUser (userId : number) {
	return getCheckups(query`"userId"=${userId}`);
}

export async function getCheckupById (id : number) {
	const checkups = await getCheckups(query`id=${id}`);
	if (checkups.length === 0) {
		throw new NotFound();
	}
	return checkups[0];
}

export async function createCheckup (data : {
    url?: string;
    description?: string;
    crontab: string;
    userId: number;
    type: 'outbound';
}) {
	const { type, url, crontab, userId } = data;
	const nextRunDueAt = parseExpression(crontab).next().toISOString();
	const [ checkup ] = await query<Array<Checkup>>`
	    insert into "checkups"(type, url, crontab, "nextRunDueAt", "userId")
	    values (${type}, ${url}, ${crontab}, ${nextRunDueAt}, ${userId})
	    returning *
	`;
	return checkup;
}
