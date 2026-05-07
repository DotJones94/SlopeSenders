export async function ensureIcksTable(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS icks (
      id BIGSERIAL PRIMARY KEY,
      target_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      author_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
}
