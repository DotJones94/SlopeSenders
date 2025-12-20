export interface Category {
  id: number
  name: string
  slug: string
}

export interface Nominee {
  id: number
  name: string
  votes: number
}

export interface CategoryPayload {
  category: Category
  nominees: Nominee[]
}

export async function getCategories(): Promise<Category[]> {
  const res = await fetch('/.netlify/functions/categories')
  return res.json()
}

// ⬇️ UPDATED: use slug
export async function getNomineesBySlug(slug: string): Promise<CategoryPayload> {
  const res = await fetch(`/.netlify/functions/nominees-by-slug?slug=${encodeURIComponent(slug)}`)
  return res.json()
}

// ⬇️ UPDATED: use slug
export async function nominateBySlug(
  slug: string,
  name: string,
): Promise<{ success?: boolean; error?: string }> {
  const res = await fetch('/.netlify/functions/nominate-by-slug', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ slug, name }),
  })
  return res.json()
}

// ✅ stays the same
export async function vote(nomineeId: number): Promise<{ success?: boolean; error?: string }> {
  const res = await fetch('/.netlify/functions/vote', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ nomineeId }),
  })
  return res.json()
}
