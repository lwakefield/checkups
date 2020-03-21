import * as Knex from "knex";


export async function up(knex: Knex): Promise<any> {
    await knex.raw(
        `
        create view "checkupStatusesByAge" as (
            select
                *,
                rank() over (partition by "checkupId" order by id desc) as age
            from "checkupStatuses"
        )
        `
    );
}


export async function down(knex: Knex): Promise<any> {
    await knex.raw('drop view "checkupStatusesByAge"');
}
