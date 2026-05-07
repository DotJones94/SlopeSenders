import { getPool } from './_db.js'
import { formatError } from './_errors.js'
import { ensureIcksTable } from './_icks.js'

export const handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

    const { id, authorUserId } = JSON.parse(event.body || '{}')
    const normalizedId = Number(id)
    const normalizedAuthorUserId = Number(authorUserId)

    if (
      !Number.isFinite(normalizedId) ||
      normalizedId <= 0 ||
      !Number.isFinite(normalizedAuthorUserId) ||
      normalizedAuthorUserId <= 0
    ) {
      return {
        statusCode: 400,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ error: 'id and authorUserId are required' }),
      }
    }

    const pool = getPool()
    await ensureIcksTable(pool)

    const { rows } = await pool.query(
      `
      DELETE FROM icks
      WHERE id = $1 AND author_user_id = $2
      RETURNING id
      `,
      [normalizedId, normalizedAuthorUserId],
    )

    if (!rows[0]) {
      return {
        statusCode: 404,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ error: 'Ick not found' }),
      }
    }

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(rows[0]),
    }
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(formatError(err)),
    }
  }
}
