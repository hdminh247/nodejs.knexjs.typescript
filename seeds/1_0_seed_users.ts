import { Knex } from "knex";

export async function seed(knex: Knex) {
  return knex("user").then(function () {
    // Inserts seed entries
    return knex("user").insert([{}]);
  });
}
