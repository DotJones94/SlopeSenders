export async function getCategories() {
  const res = await fetch('/.netlify/functions/categories')
  return res.json()
}

// ⬇️ UPDATED: use slug
export async function getNomineesBySlug(slug) {
  const res = await fetch(`/.netlify/functions/nominees-by-slug?slug=${encodeURIComponent(slug)}`)
  return res.json()
}

// ⬇️ UPDATED: use slug
export async function nominateBySlug(slug, name) {
  const res = await fetch('/.netlify/functions/nominate-by-slug', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ slug, name }),
  })
  return res.json()
}

// ✅ stays the same
export async function vote(nomineeId) {
  const res = await fetch('/.netlify/functions/vote', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ nomineeId }),
  })
  return res.json()
}
