import mariaDB from "mariadb";
if (!process.env.MARIA_DB_HOST)
    throw new Error("MARIA_DB_HOST is not defined");
if (!process.env.MARIA_DB_USER)
    throw new Error("MARIA_DB_USER is not defined");
if (!process.env.MARIA_DB_PASSWORD)
    throw new Error("MARIA_DB_PASSWORD is not defined");
if (!process.env.MARIA_DB_DATABASE)
    throw new Error("MARIA_DB_DATABASE is not defined");
export const MariaDBConnection = mariaDB.createPool({
    host: process.env.MARIA_DB_HOST,
    user: process.env.MARIA_DB_USER,
    password: process.env.MARIA_DB_PASSWORD,
    database: process.env.MARIA_DB_DATABASE,
    connectTimeout: 10000,
    connectionLimit: 10, // เพิ่มจาก 5
    idleTimeout: 30000, // Release connection หลังไม่ใช้งาน 30 วินาที
    acquireTimeout: 30000, // เพิ่มเวลารอ connection
});
