/** @type { import("drizzle-kit").Config } */
export default {
    schema: "./utils/schema.js",
    out: "./drizzle",
    driver: 'mysql2',
    dialect: 'mysql',
    dbCredentials: {
        host: 'db1.studentdetails.com',
        user: 'elevate',
        password: 'interview_waves',
        database: 'triangles',
        port: 3306,
        ssl: {
            rejectUnauthorized: false
        }
    }
};