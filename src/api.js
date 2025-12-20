export async function getCategories() {
  const res = await fetch('/.netlify/functions/categories')
  return res.json()
}

export async function getNominees(categoryId) {
  const res = await fetch(
    `/.netlify/functions/nominees?categoryId=${encodeURIComponent(categoryId)}`,
  )
  return res.json()
}

export async function nominate(categoryId, name) {
  const res = await fetch('/.netlify/functions/nominate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ categoryId, name }),
  })
  return res.json()
}

export async function vote(nomineeId) {
  const res = await fetch('/.netlify/functions/vote', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ nomineeId }),
  })
  return res.json()
}
