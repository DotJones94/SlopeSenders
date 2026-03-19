import { getPool } from './_db.js'
import { formatError } from './_errors.js'

export const handler = async () => {
  try {
    const pool = getPool()
    const { rows } = await pool.query(
      `
      SELECT id, name
      FROM users
      ORDER BY name ASC
      `,
    )

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(rows),
    }
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(formatError(err)),
    }
  }
}
