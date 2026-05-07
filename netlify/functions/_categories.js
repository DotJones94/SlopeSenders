import { baseCategories } from '../../src/data/baseCategories.js'

export function slugifyCategoryValue(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function buildCanonicalCategories() {
  return baseCategories.flatMap((section) =>
    section.tiles.map((tile) => ({
      slug: `${slugifyCategoryValue(section.id)}-${slugifyCategoryValue(tile.title)}`,
      section: section.id,
      name: tile.title,
      description: tile.description,
    })),
  )
}

export async function syncCategories(pool) {
  const canonicalCategories = buildCanonicalCategories()
  const slugsBySection = new Map()

  for (const category of canonicalCategories) {
    const sectionSlugs = slugsBySection.get(category.section) ?? []
    sectionSlugs.push(category.slug)
    slugsBySection.set(category.section, sectionSlugs)
  }

  await pool.query('BEGIN')

  try {
    for (const category of canonicalCategories) {
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
        [category.slug, category.section, category.name, category.description],
      )
    }

    for (const [section, slugs] of slugsBySection.entries()) {
      await pool.query(
        `
        DELETE FROM categories
        WHERE section = $1
          AND NOT (slug = ANY($2::text[]))
        `,
        [section, slugs],
      )
    }

    await pool.query('COMMIT')
  } catch (error) {
    await pool.query('ROLLBACK')
    throw error
  }

  return canonicalCategories
}

export async function resolveCategoryBySlug(pool, slug) {
  const existingCategoryRes = await pool.query(
    `SELECT id, name, slug FROM categories WHERE slug = $1`,
    [slug],
  )

  if (existingCategoryRes.rows[0]) {
    return existingCategoryRes.rows[0]
  }

  const canonicalCategory = buildCanonicalCategories().find((category) => category.slug === slug)
  if (!canonicalCategory) {
    return null
  }

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
    [
      canonicalCategory.slug,
      canonicalCategory.section,
      canonicalCategory.name,
      canonicalCategory.description,
    ],
  )

  const insertedCategoryRes = await pool.query(
    `SELECT id, name, slug FROM categories WHERE slug = $1`,
    [slug],
  )

  return insertedCategoryRes.rows[0] ?? null
}
