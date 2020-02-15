import * as Knex from "knex";

function addPrelude (table, knex) {
        table.increments();
        table.timestamp('createdAt').defaultTo(knex.fn.now())
        table.timestamp('updatedAt').defaultTo(knex.fn.now())
}

export async function up(knex: Knex): Promise<any> {
    await knex.schema.createTable('users', (table) => {
        addPrelude(table, knex);
        table.string('email').unique();
        table.string('passwordHash');
    });

    await knex.schema.createTable('sessions', (table) => {
        addPrelude(table, knex);
        table.integer('userId').references('users.id');
        table.string('token');
        table.dateTime('expiresAt');
        table.boolean('valid').defaultTo(true);
    });

    await knex.schema.createTable('checkups', (table) => {
        addPrelude(table, knex);
        table.integer('userId').references('users.id');
        table.string('url');
        table.string('crontab');
        table.dateTime('nextRunDueAt');
    });

    await knex.schema.createTable('tasks', (table) => {
        addPrelude(table, knex);
        table.string('name');
        table.json('payload');
        table.string('status');
    });

    await knex.schema.createTable('checkupStatuses', (table) => {
        addPrelude(table, knex);
        table.integer('checkupId').unsigned().references('checkups.id');
        table.dateTime('dueAt');
        table.dateTime('ranAt');
        table.integer('status');
    });
}


export async function down(knex: Knex): Promise<any> {
    await knex.schema.dropTable('checkupStatuses');
    await knex.schema.dropTable('checkups');
    await knex.schema.dropTable('sessions');
    await knex.schema.dropTable('users');
    await knex.schema.dropTable('tasks');
}
