
import "dotenv/config";
import { MariaDBConnection } from "../lib/config.mariaDB";

const TABLE_NAME = process.env.MARIA_DB_TABLE_BEHAVIOR_HISTORY || "behavior_history_pkw";

async function migrate() {
  console.log(`Creating table ${TABLE_NAME}...`);
  const conn = await MariaDBConnection.getConnection();
  try {
    const sql = `
      CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
        ID INT AUTO_INCREMENT PRIMARY KEY,
        STUDENT_ID VARCHAR(255) NOT NULL,
        SCORE INT NOT NULL,
        REASON TEXT,
        TEACHER_ID VARCHAR(255),
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await conn.execute(sql);
    console.log("Table created successfully.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    conn.release();
    process.exit(0);
  }
}

migrate();
