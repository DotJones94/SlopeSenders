import { getPool } from './_db.js'
import { resolveCategoryBySlug } from './_categories.js'

export const handler = async (event) => {
  try {
    const slug = event.queryStringParameters?.slug
    const voterUserId = Number(event.queryStringParameters?.voterUserId)
    if (!slug) {
      return { statusCode: 400, body: JSON.stringify({ error: 'slug required' }) }
    }

    const pool = getPool()

    const category = await resolveCategoryBySlug(pool, slug)
    if (!category) {
      return { statusCode: 404, body: JSON.stringify({ error: 'category not found' }) }
    }

    const { rows } = await pool.query(
      `
      SELECT
        n.id,
        n.nominee_user_id AS "nomineeUserId",
        nominee.name AS "nomineeName",
        n.nominated_by_user_id AS "nominatedByUserId",
        nominator.name AS "nominatedByName",
        COUNT(v.id)::int AS votes
      FROM nominees n
      JOIN users nominee ON nominee.id = n.nominee_user_id
      LEFT JOIN users nominator ON nominator.id = n.nominated_by_user_id
      LEFT JOIN votes v ON v.nominee_id = n.id
      WHERE n.category_id = $1
      GROUP BY n.id, nominee.name, nominator.name
      ORDER BY votes DESC, nominee.name ASC
      `,
      [category.id],
    )

    let currentUserVoteNomineeId = null

    if (Number.isFinite(voterUserId) && voterUserId > 0) {
      const voteRes = await pool.query(
        `
        SELECT v.nominee_id AS "nomineeId"
        FROM votes v
        JOIN nominees n ON n.id = v.nominee_id
        WHERE v.voter_user_id = $1
          AND n.category_id = $2
        LIMIT 1
        `,
        [voterUserId, category.id],
      )

      currentUserVoteNomineeId = voteRes.rows[0]?.nomineeId ?? null
    }

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ category, nominees: rows, currentUserVoteNomineeId }),
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
