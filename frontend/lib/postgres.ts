import { Pool } from 'pg';

let pool: Pool | null = null;

export function getPostgresPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5433', 10),
      database: process.env.POSTGRES_DB || 'ecommerce',
      user: process.env.POSTGRES_USER || 'admin',
      password: process.env.POSTGRES_PASSWORD || 'postgres_password',
    });
  }

  return pool;
}

export async function closePostgresPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
