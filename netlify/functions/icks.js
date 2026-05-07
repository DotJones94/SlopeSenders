import { getPool } from './_db.js'
import { formatError } from './_errors.js'
import { ensureIcksTable } from './_icks.js'

export const handler = async (event) => {
  try {
    const authorUserId = Number(event.queryStringParameters?.authorUserId)
    const pool = getPool()

    await ensureIcksTable(pool)

    const params = []
    const where =
      Number.isFinite(authorUserId) && authorUserId > 0 ? `WHERE i.author_user_id = $1` : ''

    if (where) {
      params.push(authorUserId)
    }

    const { rows } = await pool.query(
      `
      SELECT
        i.id,
        i.target_user_id AS "targetUserId",
        target_user.name AS "targetUserName",
        i.author_user_id AS "authorUserId",
        author_user.name AS "authorUserName",
        i.text,
        i.created_at AS "createdAt"
      FROM icks i
      JOIN users target_user ON target_user.id = i.target_user_id
      JOIN users author_user ON author_user.id = i.author_user_id
      ${where}
      ORDER BY i.created_at DESC, i.id DESC
      `,
      params,
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
