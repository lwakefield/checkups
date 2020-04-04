import * as knex from 'knex';

import { query } from '../db';
import { NotFound } from '../errors';

export async function getCheckups (filter : knex.Raw = query`1=1`) {
	return query<{
		id: number;
		createdAt: string;
		updatedAt: string;
		userId: number;
		type: string;
		url: string;
		crontab: string;
		token: string;
		nextRunDueAt: string;
		recentStatuses: Array<{
			status: number;
			createdAt: string;
		}>;
	}>`
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
