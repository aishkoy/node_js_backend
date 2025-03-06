import Knex from 'knex';


let knex;

export async function getKnex() {
    if (knex) {
        return knex;
    }

    const PG_URI = 'postgres://postgres:qwerty@localhost/suslike';
    knex = Knex(PG_URI);

    return knex;
}