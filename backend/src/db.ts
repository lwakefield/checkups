import * as knex from 'knex';

export const db = knex({
    client: 'pg',
    connection: process.env.DB_URI,
    postProcessResponse: (result, context) => {
        const isRaw = result.command;
        if (isRaw) {
            return result.rows;
        }

        return result;
    }
});

export async function init () {
    await db.migrate.latest();
}

export function query (parts : TemplateStringsArray, ...bindings : Array<knex.RawBinding>) {
    return db.raw(parts.join('?'), bindings);
}

export async function transaction () {
    const transaction = await db.transaction();
    return {
        commit: transaction.commit,
        rollback: transaction.rollback,
        query (parts : TemplateStringsArray, ...bindings : Array<string|number>) {
            return transaction.raw(parts.join('?'), bindings);
        }
    }
}
