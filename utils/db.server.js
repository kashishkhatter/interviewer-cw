import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

// Create the connection pool with better settings
const poolConnection = mysql.createPool({
    host: 'db1.studentdetails.com',
    user: 'elevate',
    password: 'interview_waves',
    database: 'triangles',
    port: 3306,
    ssl: {
        rejectUnauthorized: false
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    multipleStatements: false, // For security
    debug: process.env.NODE_ENV === 'development',
    connectTimeout: 10000, // 10 seconds
    acquireTimeout: 10000
});

// Test the connection
poolConnection.getConnection()
    .then(connection => {
        console.log('Database connection successful');
        connection.release();
    })
    .catch(error => {
        console.error('Database connection error:', {
            code: error.code,
            errno: error.errno,
            sqlState: error.sqlState,
            sqlMessage: error.sqlMessage
        });
    });

// Create the Drizzle instance with query logging in development
export const db = drizzle(poolConnection, { 
    schema,
    mode: 'default',
    logger: process.env.NODE_ENV === 'development'
}); 