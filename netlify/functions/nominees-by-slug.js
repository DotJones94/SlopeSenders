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
        n.id,
        n.name,
        COUNT(v.id)::int AS votes
      FROM nominees n
      LEFT JOIN votes v ON v.nominee_id = n.id
      WHERE n.category_id = $1
      GROUP BY n.id
      ORDER BY votes DESC, n.name ASC
      `,
      [category.id],
    )

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ category, nominees: rows }),
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
