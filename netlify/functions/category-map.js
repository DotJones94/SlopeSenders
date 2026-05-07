import { getPool } from './_db.js'
import { syncCategories } from './_categories.js'

export const handler = async () => {
  try {
    const pool = getPool()
    await syncCategories(pool)
    const { rows } = await pool.query(`SELECT id, slug FROM categories`)
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(rows.map((r) => [r.slug, r.id]))),
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
