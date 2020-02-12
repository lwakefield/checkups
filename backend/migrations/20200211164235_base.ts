import * as Knex from "knex";

export async function up(knex: Knex): Promise<any> {
    await knex.schema.createTable('users', (table) => {
        table.increments();
        table.string('email').unique();
        table.string('passwordHash');
    });

    await knex.schema.createTable('sessions', (table) => {
        table.increments();
        table.integer('userId').references('users.id');
        table.string('token');
        table.dateTime('expiresAt');
        table.boolean('valid').defaultTo(true);
    });

    await knex.schema.createTable('scheduledCheckups', (table) => {
        table.increments();
        table.integer('userId').references('users.id');
        table.string('url');
        table.string('crontab');
        table.dateTime('nextRunDueAt');
    });

    await knex.schema.createTable('scheduledCheckupStatuses', (table) => {
        table.integer('scheduledCheckupId').unsigned();
        table.foreign('scheduledCheckupId').references('scheduledCheckups.id');
        table.dateTime('dueAt');
        table.string('status');
    });
}


export async function down(knex: Knex): Promise<any> {
    await knex.schema.dropTable('scheduledCheckupStatuses');
    await knex.schema.dropTable('scheduledCheckups');
    await knex.schema.dropTable('sessions');
    await knex.schema.dropTable('users');
}
