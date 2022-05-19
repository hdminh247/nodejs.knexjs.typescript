import { Knex } from "knex";

export async function up(knex: Knex): Promise<any> {
  await knex.schema.createTable("users", (table: Knex.TableBuilder) => {
    table.increments("id").primary();

    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
    table.timestamp("deleted_at").defaultTo(null);
  });
}

export async function down(knex: Knex): Promise<any> {
  await knex.schema.dropTable("user");
}
