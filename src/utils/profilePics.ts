const profilePicModules = import.meta.glob('../assets/images/profile-pics/*', {
  eager: true,
  import: 'default',
}) as Record<string, string>

const profilePicMap = Object.entries(profilePicModules).reduce<Record<string, string>>((acc, [path, url]) => {
  const fileName = path.split('/').pop()?.replace(/\.[^.]+$/, '') ?? ''
  acc[normalizeName(fileName)] = url
  return acc
}, {})

function normalizeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function buildDefaultAvatar(name: string) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?'

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8" />
          <stop offset="100%" stop-color="#6366f1" />
        </linearGradient>
      </defs>
      <rect width="120" height="120" rx="36" fill="url(#g)" />
      <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="white"
        font-family="Arial, sans-serif" font-size="42" font-weight="700">${initials}</text>
    </svg>
  `

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

export function getProfilePicUrl(name?: string | null) {
  if (!name) return buildDefaultAvatar('Unknown')
  return profilePicMap[normalizeName(name)] ?? buildDefaultAvatar(name)
}
