import { getPool } from './_db.js'
import { formatError } from './_errors.js'
import { ensureIcksTable } from './_icks.js'

export const handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

    const { targetUserId, authorUserId, text } = JSON.parse(event.body || '{}')
    const normalizedTargetUserId = Number(targetUserId)
    const normalizedAuthorUserId = Number(authorUserId)
    const trimmedText = typeof text === 'string' ? text.trim() : ''

    if (
      !Number.isFinite(normalizedTargetUserId) ||
      normalizedTargetUserId <= 0 ||
      !Number.isFinite(normalizedAuthorUserId) ||
      normalizedAuthorUserId <= 0 ||
      !trimmedText
    ) {
      return {
        statusCode: 400,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ error: 'targetUserId, authorUserId, and text are required' }),
      }
    }

    const pool = getPool()
    await ensureIcksTable(pool)

    const userRes = await pool.query(`SELECT id, name FROM users WHERE id = ANY($1::int[])`, [
      [normalizedTargetUserId, normalizedAuthorUserId],
    ])

    if (userRes.rows.length < 2 && normalizedTargetUserId !== normalizedAuthorUserId) {
      return {
        statusCode: 404,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ error: 'One or more selected riders were not found' }),
      }
    }

    if (userRes.rows.length < 1) {
      return {
        statusCode: 404,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ error: 'Selected rider not found' }),
      }
    }

    const { rows } = await pool.query(
      `
      INSERT INTO icks (target_user_id, author_user_id, text)
      VALUES ($1, $2, $3)
      RETURNING
        id,
        target_user_id AS "targetUserId",
        author_user_id AS "authorUserId",
        text,
        created_at AS "createdAt"
      `,
      [normalizedTargetUserId, normalizedAuthorUserId, trimmedText],
    )

    const created = rows[0]
    const nameById = new Map(userRes.rows.map((row) => [Number(row.id), row.name]))

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ...created,
        targetUserName: nameById.get(created.targetUserId) ?? 'Unknown rider',
        authorUserName: nameById.get(created.authorUserId) ?? 'Unknown rider',
      }),
    }
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(formatError(err)),
    }
  }
}
