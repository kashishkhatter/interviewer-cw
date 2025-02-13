/** @type { import("drizzle-kit").Config } */
export default {
    schema: "./utils/schema.js",
    dialect: 'postgresql',
    dbCredentials: {
        url: 'postgresql://neondb_owner:npg_CFUzPVg0rnh2@ep-winter-sun-a8rbgqeu-pooler.eastus2.azure.neon.tech/neondb?sslmode=require',
    }
};