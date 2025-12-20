import { getPool } from './_db.js'

export const handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

    const { slug, name } = JSON.parse(event.body || '{}')
    if (!slug || !name?.trim()) {
      return { statusCode: 400, body: JSON.stringify({ error: 'slug and name required' }) }
    }

    const pool = getPool()

    const catRes = await pool.query(`SELECT id FROM categories WHERE slug = $1`, [slug])
    const category = catRes.rows[0]
    if (!category) return { statusCode: 404, body: JSON.stringify({ error: 'category not found' }) }

    const { rows } = await pool.query(
      `
      INSERT INTO nominees (category_id, name)
      VALUES ($1, $2)
      ON CONFLICT (category_id, name)
      DO UPDATE SET name = EXCLUDED.name
      RETURNING id, name
      `,
      [category.id, name.trim()],
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
