/** @type { import("drizzle-kit").Config } */
export default {
    schema: "./utils/schema.js",
    out: "./drizzle",
    driver: 'mysql2',
    dialect: 'mysql',
    dbCredentials: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        port: process.env.DB_PORT,
        ssl: {
            rejectUnauthorized: false
        }
    }
};