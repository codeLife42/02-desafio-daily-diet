import knex from "knex";

const config = {
  client: "sqlite3",
  connection: {
    filename: "./db/app.db",
  },
  migrations: {
    extension: "ts",
    directory: "./db/migrations",
  },
  useNullAsDefault: true,
};

const knexInstance = knex(config);

export { config, knexInstance };
