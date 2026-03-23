import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  min: parseInt(process.env.DB_POOL_MIN ?? "2", 10),
  max: parseInt(process.env.DB_POOL_MAX ?? "10", 10),
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
  statement_timeout: 30000,
});

export default pool;
