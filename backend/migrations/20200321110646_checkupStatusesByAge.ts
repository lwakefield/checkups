import * as Knex from "knex";


export async function up(knex: Knex): Promise<any> {
    await knex.raw(`
        create view "recentCheckupStatuses" as (
            with "statusesByAge" as (
                    select
                            *,
                            rank() over (partition by "checkupId" order by id desc) as age
                    from "checkupStatuses"
            ),
            "recentStatuses" as (
                    select *
                    from "statusesByAge"
                    where age <= 5
            )
            select
                    "checkupId",
                    json_agg(json_build_object('status', "status", 'createdAt', "createdAt")) as "recentStatuses"
            from "recentStatuses"
            group by "checkupId"
        )
    `);
}


export async function down(knex: Knex): Promise<any> {
    await knex.raw('drop view "recentCheckupStatuses"');
}
