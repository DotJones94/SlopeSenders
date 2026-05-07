import { getPool } from './_db.js'
import { resolveCategoryBySlug } from './_categories.js'

export const handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

    const { slug, nomineeUserId, nominatedByUserId } = JSON.parse(event.body || '{}')
    if (!slug || !nomineeUserId || !nominatedByUserId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'slug, nomineeUserId, and nominatedByUserId required' }),
      }
    }

    const pool = getPool()

    const category = await resolveCategoryBySlug(pool, slug)
    if (!category) return { statusCode: 404, body: JSON.stringify({ error: 'category not found' }) }

    const userRes = await pool.query(`SELECT id, name FROM users WHERE id = ANY($1::int[])`, [
      [nomineeUserId, nominatedByUserId],
    ])
    if (userRes.rows.length !== new Set([nomineeUserId, nominatedByUserId]).size) {
      return { statusCode: 404, body: JSON.stringify({ error: 'user not found' }) }
    }

    const nomineeUser = userRes.rows.find((user) => Number(user.id) === Number(nomineeUserId))
    if (!nomineeUser) {
      return { statusCode: 404, body: JSON.stringify({ error: 'nominee user not found' }) }
    }

    const { rows } = await pool.query(
      `
      INSERT INTO nominees (category_id, name, nominee_user_id, nominated_by_user_id)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (category_id, nominee_user_id)
      DO UPDATE SET
        name = EXCLUDED.name,
        nominated_by_user_id = COALESCE(nominees.nominated_by_user_id, EXCLUDED.nominated_by_user_id)
      RETURNING id
      `,
      [category.id, nomineeUser.name, nomineeUserId, nominatedByUserId],
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
