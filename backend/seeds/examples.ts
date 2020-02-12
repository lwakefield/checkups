import * as Knex from 'knex';
import * as bcrypt from 'bcrypt';

export async function seed(knex: Knex): Promise<any> {
    const [ { id: userId } ] = await knex('users')
        .insert({
            email: 'alice@example.com',
            passwordHash: await bcrypt.hash('password123', 14)
        }).returning('*');

    await knex('scheduledCheckups').insert({
        userId,
        url: 'https://example.com',
        crontab: '*/2 * * * *',
        nextRunDueAt: (new Date()).toISOString(),
    })
};
