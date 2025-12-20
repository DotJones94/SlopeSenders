import { getPool } from './_db.js'

export const handler = async () => {
  try {
    const pool = getPool()
    const { rows } = await pool.query(
      `SELECT id, name, description
       FROM categories
       ORDER BY created_at DESC`,
    )

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(rows),
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
