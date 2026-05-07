import { getPool } from './_db.js'
import { syncCategories } from './_categories.js'

export const handler = async () => {
  try {
    const pool = getPool()
    const rowsToUpsert = await syncCategories(pool)

    // Return mapping so frontend can use it
    const { rows } = await pool.query(`SELECT id, slug FROM categories`)
    const mapping = Object.fromEntries(rows.map((r) => [r.slug, r.id]))

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ok: true, count: rowsToUpsert.length, mapping }),
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
