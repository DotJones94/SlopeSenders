import pg from 'pg'

const { Pool } = pg

let pool

function getConnectionString() {
  return process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL || null
}

// Reuse pool across function invocations
export function getPool() {
  const connectionString = getConnectionString()

  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is missing. Add DATABASE_URL or NETLIFY_DATABASE_URL to Netlify environment variables or your local `netlify dev` environment.',
    )
  }

  if (!pool) {
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }, // common for hosted postgres
    })
  }
  return pool
}
