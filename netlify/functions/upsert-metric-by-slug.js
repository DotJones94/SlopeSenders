import { getPool } from './_db.js'
import { resolveCategoryBySlug } from './_categories.js'

export const handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

    const { slug, userId, value } = JSON.parse(event.body || '{}')
    const numericValue = Number(value)

    if (!slug || !userId || !Number.isFinite(numericValue) || numericValue < 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'slug, userId, and a non-negative numeric value are required' }),
      }
    }

    const pool = getPool()

    const category = await resolveCategoryBySlug(pool, slug)
    if (!category) {
      return { statusCode: 404, body: JSON.stringify({ error: 'category not found' }) }
    }

    const userRes = await pool.query(`SELECT id FROM users WHERE id = $1`, [userId])
    if (!userRes.rows[0]) {
      return { statusCode: 404, body: JSON.stringify({ error: 'user not found' }) }
    }

    const { rows } = await pool.query(
      `
      INSERT INTO metric_entries (category_id, user_id, value)
      VALUES ($1, $2, $3)
      ON CONFLICT (category_id, user_id)
      DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
      RETURNING id, value, updated_at AS "updatedAt"
      `,
      [category.id, userId, numericValue],
    )

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(rows[0]),
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
