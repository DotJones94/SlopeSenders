import { getPool } from './_db.js'

export const handler = async (event) => {
  try {
    const categoryId = event.queryStringParameters?.categoryId
    if (!categoryId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'categoryId required' }) }
    }

    const pool = getPool()
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
      [categoryId],
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
