import { getPool } from './_db.js'
import { syncCategories } from './_categories.js'

export const handler = async () => {
  try {
    const pool = getPool()
    await syncCategories(pool)
    const { rows } = await pool.query(
      `SELECT id, name, slug, description
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
