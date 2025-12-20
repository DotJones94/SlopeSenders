import { getPool } from './_db.js'

// Basic slugify without extra deps
function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// Put your baseCategories in a separate module you can import from both Vue + functions.
// E.g. move baseCategories into src/data/baseCategories.ts (no Vue-only stuff).
import { baseCategories } from '../../src/data/categories.js'

export const handler = async () => {
  try {
    const pool = getPool()

    // Flatten tiles into DB "categories"
    const rowsToUpsert = []
    for (const section of baseCategories) {
      for (const tile of section.tiles) {
        // stable slug based on section + tile title
        const slug = `${slugify(section.id)}-${slugify(tile.title)}`
        rowsToUpsert.push({
          slug,
          section: section.id,
          name: tile.title,
          description: tile.description,
        })
      }
    }

    // Upsert all
    for (const r of rowsToUpsert) {
      await pool.query(
        `
        INSERT INTO categories (slug, section, name, description)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (slug)
        DO UPDATE SET
          section = EXCLUDED.section,
          name = EXCLUDED.name,
          description = EXCLUDED.description
        `,
        [r.slug, r.section, r.name, r.description],
      )
    }

    // Return mapping so frontend can use it
    const { rows } = await pool.query(`SELECT id, slug FROM categories`)
    const mapping = Object.fromEntries(rows.map((r) => [r.slug, r.id]))

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ok: true, count: rowsToUpsert.length, mapping }),
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
