import { getPool } from './_db.js'

export const handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

    const { nomineeId, voterUserId } = JSON.parse(event.body || '{}')
    if (!nomineeId || !voterUserId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'nomineeId and voterUserId required' }),
      }
    }

    const pool = getPool()
    const nomineeRes = await pool.query(
      `
      SELECT id, category_id AS "categoryId", nominee_user_id AS "nomineeUserId"
      FROM nominees
      WHERE id = $1
      `,
      [nomineeId],
    )
    const nominee = nomineeRes.rows[0]
    if (!nominee) {
      return { statusCode: 404, body: JSON.stringify({ error: 'nominee not found' }) }
    }

    const voterRes = await pool.query(`SELECT id FROM users WHERE id = $1`, [voterUserId])
    if (!voterRes.rows[0]) {
      return { statusCode: 404, body: JSON.stringify({ error: 'voter not found' }) }
    }

    if (Number(nominee.nomineeUserId) === Number(voterUserId)) {
      return { statusCode: 400, body: JSON.stringify({ error: 'You cannot vote for yourself.' }) }
    }

    const existingVoteRes = await pool.query(
      `
      SELECT v.id
      FROM votes v
      JOIN nominees n ON n.id = v.nominee_id
      WHERE v.voter_user_id = $1
        AND n.category_id = $2
      LIMIT 1
      `,
      [voterUserId, nominee.categoryId],
    )

    if (existingVoteRes.rows[0]) {
      return {
        statusCode: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ok: true, duplicate: true }),
      }
    }

    const result = await pool.query(
      `
      INSERT INTO votes (nominee_id, voter_user_id, voter_hash)
      VALUES ($1, $2, $3)
      ON CONFLICT (nominee_id, voter_user_id) DO NOTHING
      RETURNING id
      `,
      [nomineeId, voterUserId, `user:${voterUserId}`],
    )

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ok: true, duplicate: result.rowCount === 0 }),
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
