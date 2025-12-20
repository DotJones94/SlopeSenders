import pg from 'pg'

const { Pool } = pg

let pool

// Reuse pool across function invocations
export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // common for hosted postgres
    })
  }
  return pool
}
