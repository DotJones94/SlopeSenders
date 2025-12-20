import { getPool } from './_db.js'

export const handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

    const { categoryId, name } = JSON.parse(event.body || '{}')
    if (!categoryId || !name?.trim()) {
      return { statusCode: 400, body: JSON.stringify({ error: 'categoryId and name required' }) }
    }

    const pool = getPool()

    // Insert nominee; if already exists (unique constraint), return existing row
    const { rows } = await pool.query(
      `
      INSERT INTO nominees (category_id, name)
      VALUES ($1, $2)
      ON CONFLICT (category_id, name)
      DO UPDATE SET name = EXCLUDED.name
      RETURNING id, name
      `,
      [categoryId, name.trim()],
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
