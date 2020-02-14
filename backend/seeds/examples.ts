import * as Knex from 'knex';
import * as bcrypt from 'bcrypt';

export async function seed(knex: Knex): Promise<any> {
    const [ { id: userId } ] = await knex('users')
        .insert({
            email: 'alice@example.com',
            passwordHash: await bcrypt.hash('password123', 14)
        }).returning('*');

    await knex('scheduledCheckups').insert([
        {
            userId,
            url: 'http://test-service/health?flakiness=0.99',
            crontab: '* * * * *',
            nextRunDueAt: (new Date()).toISOString(),
        },
        {
            userId,
            url: 'http://test-service/health?flakiness=0.8',
            crontab: '* * * * *',
            nextRunDueAt: (new Date()).toISOString(),
        },
        {
            userId,
            url: 'http://test-service/health?flakiness=0.2',
            crontab: '* * * * *',
            nextRunDueAt: (new Date()).toISOString(),
        },
        {
            userId,
            url: 'http://test-service/health?flakiness=0.01',
            crontab: '* * * * *',
            nextRunDueAt: (new Date()).toISOString(),
        },
    ])
};
