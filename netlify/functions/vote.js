import { getPool } from './_db.js'
import crypto from 'crypto'

function getVoterHash(event) {
  // Simple approach: hash IP + user-agent (good enough for now; not perfect)
  const ip =
    event.headers['x-nf-client-connection-ip'] || event.headers['x-forwarded-for'] || 'unknown'
  const ua = event.headers['user-agent'] || 'unknown'
  return crypto.createHash('sha256').update(`${ip}|${ua}`).digest('hex')
}

export const handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

    const { nomineeId } = JSON.parse(event.body || '{}')
    if (!nomineeId)
      return { statusCode: 400, body: JSON.stringify({ error: 'nomineeId required' }) }

    const voterHash = getVoterHash(event)
    const pool = getPool()

    // Insert vote; if already voted for this nominee, ignore
    await pool.query(
      `
      INSERT INTO votes (nominee_id, voter_hash)
      VALUES ($1, $2)
      ON CONFLICT (nominee_id, voter_hash) DO NOTHING
      `,
      [nomineeId, voterHash],
    )

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ok: true }),
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
