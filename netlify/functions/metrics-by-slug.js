import { getPool } from './_db.js'

export const handler = async (event) => {
  try {
    const slug = event.queryStringParameters?.slug
    if (!slug) {
      return { statusCode: 400, body: JSON.stringify({ error: 'slug required' }) }
    }

    const pool = getPool()

    const catRes = await pool.query(`SELECT id, name, slug FROM categories WHERE slug = $1`, [slug])
    const category = catRes.rows[0]

    if (!category) {
      return { statusCode: 404, body: JSON.stringify({ error: 'category not found' }) }
    }

    const { rows } = await pool.query(
      `
      SELECT
        COALESCE(me.id, -u.id) AS id,
        u.id AS "userId",
        u.name AS "userName",
        COALESCE(me.value, 0)::float AS value,
        me.updated_at AS "updatedAt"
      FROM users u
      LEFT JOIN metric_entries me
        ON me.user_id = u.id
       AND me.category_id = $1
      ORDER BY COALESCE(me.value, 0) DESC, me.updated_at ASC NULLS LAST, u.name ASC
      `,
      [category.id],
    )

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ category, entries: rows }),
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
