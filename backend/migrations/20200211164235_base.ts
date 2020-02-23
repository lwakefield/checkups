import * as Knex from "knex";

function addPrelude (table, knex) {
        table.increments();
        table.timestamp('createdAt').defaultTo(knex.fn.now())
        table.timestamp('updatedAt').defaultTo(knex.fn.now())
}

export async function up(knex: Knex): Promise<any> {
    await knex.schema.createTable('users', (table) => {
        addPrelude(table, knex);
        table.string('email').unique().notNullable();
        table.string('passwordHash').notNullable();
    });

    await knex.schema.createTable('sessions', (table) => {
        addPrelude(table, knex);
        table.integer('userId').references('users.id');
        table.string('token', 512).notNullable();
        table.dateTime('expiresAt').notNullable();
        table.boolean('valid').defaultTo(true);
    });

    await knex.schema.createTable('resetPasswordTokens', (table) => {
        addPrelude(table, knex);
        table.integer('userId').references('users.id');
        table.string('token', 512).notNullable();
        table.dateTime('expiresAt').notNullable();
        table.boolean('valid').defaultTo(true);
    });

    await knex.schema.createTable('checkups', (table) => {
        addPrelude(table, knex);
        table.integer('userId').references('users.id');
        table.enum('type', ['inbound', 'outbound']);
        table.string('description');
        table.string('url');
        table.string('token');
        table.string('crontab').notNullable();
        table.dateTime('nextRunDueAt').notNullable();
    });

    await knex.schema.createTable('checkupStatuses', (table) => {
        addPrelude(table, knex);
        table.integer('checkupId').unsigned().references('checkups.id');
        table.dateTime('dueAt').notNullable();
        table.dateTime('ranAt').notNullable();
        table.integer('status').notNullable();
    });

    await knex.schema.createTable('tasks', (table) => {
        addPrelude(table, knex);
        table.string('name').notNullable();
        table.json('payload').notNullable();
        table.string('status').defaultTo('queued').notNullable();
    });
}


export async function down(knex: Knex): Promise<any> {
    await knex.schema.dropTable('checkupStatuses');
    await knex.schema.dropTable('checkups');
    await knex.schema.dropTable('sessions');
    await knex.schema.dropTable('users');
    await knex.schema.dropTable('tasks');
}
