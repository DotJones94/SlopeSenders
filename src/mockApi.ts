import { baseCategories } from '@/data/categories'
import type { Category, CategoryPayload, IckEntry, MetricPayload, Nominee, User } from '@/api'

const STORAGE_KEY = 'slopesenders.mockDb'

type MockMetricEntry = {
  id: number
  categoryId: number
  userId: number
  value: number
  updatedAt: string | null
}

type MockNomineeEntry = {
  id: number
  categoryId: number
  nomineeUserId: number
  nominatedByUserId: number | null
}

type MockVoteEntry = {
  nomineeId: number
  voterUserId: number
}

type MockDb = {
  nextNomineeId: number
  nextMetricId: number
  nextIckId: number
  users: User[]
  nominees: MockNomineeEntry[]
  votes: MockVoteEntry[]
  metricEntries: MockMetricEntry[]
  icks: IckEntry[]
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

const categories = baseCategories.flatMap((section, sectionIndex) =>
  section.tiles.map((tile, tileIndex) => ({
    id: sectionIndex * 100 + tileIndex + 1,
    name: tile.title,
    slug: `${slugify(section.id)}-${slugify(tile.title)}`,
    sectionId: section.id,
  })),
)

const categoryBySlug = new Map(categories.map((category) => [category.slug, category]))

const defaultUsers: User[] = [
  { id: 1, name: 'Kelly' },
  { id: 2, name: 'Georgia' },
  { id: 3, name: 'Josh' },
  { id: 4, name: 'Big Mike' },
  { id: 5, name: 'Zoe' },
  { id: 6, name: 'Sophie' },
  { id: 7, name: 'Maria' },
  { id: 8, name: 'Rachael McV' },
]

function getInitialMockDb(): MockDb {
  return {
    nextNomineeId: 1000,
    nextMetricId: 5000,
    nextIckId: 8000,
    users: defaultUsers,
    nominees: [
      {
        id: 1,
        categoryId: getCategoryId('bests-improved'),
        nomineeUserId: 5,
        nominatedByUserId: 1,
      },
      {
        id: 2,
        categoryId: getCategoryId('bests-improved'),
        nomineeUserId: 8,
        nominatedByUserId: 6,
      },
      {
        id: 3,
        categoryId: getCategoryId('predictions-hit-a-tree'),
        nomineeUserId: 4,
        nominatedByUserId: 2,
      },
      {
        id: 4,
        categoryId: getCategoryId('predictions-improve'),
        nomineeUserId: 3,
        nominatedByUserId: 7,
      },
    ],
    votes: [
      { nomineeId: 1, voterUserId: 2 },
      { nomineeId: 1, voterUserId: 3 },
      { nomineeId: 2, voterUserId: 5 },
      { nomineeId: 3, voterUserId: 1 },
    ],
    metricEntries: [
      {
        id: 1,
        categoryId: getCategoryId('metrics-vertical-meters'),
        userId: 1,
        value: 18642,
        updatedAt: isoDate(-8),
      },
      {
        id: 2,
        categoryId: getCategoryId('metrics-vertical-meters'),
        userId: 6,
        value: 17410,
        updatedAt: isoDate(-6),
      },
      {
        id: 3,
        categoryId: getCategoryId('metrics-overall-runs'),
        userId: 3,
        value: 121,
        updatedAt: isoDate(-4),
      },
      {
        id: 4,
        categoryId: getCategoryId('metrics-overall-runs'),
        userId: 8,
        value: 118,
        updatedAt: isoDate(-3),
      },
      {
        id: 5,
        categoryId: getCategoryId('metrics-days-on-the-slopes'),
        userId: 5,
        value: 19,
        updatedAt: isoDate(-7),
      },
      {
        id: 6,
        categoryId: getCategoryId('metrics-days-on-the-slopes'),
        userId: 2,
        value: 17,
        updatedAt: isoDate(-2),
      },
      {
        id: 7,
        categoryId: getCategoryId('metrics-different-resorts'),
        userId: 7,
        value: 6,
        updatedAt: isoDate(-9),
      },
      {
        id: 8,
        categoryId: getCategoryId('metrics-top-speed'),
        userId: 1,
        value: 78.5,
        updatedAt: isoDate(-1),
      },
    ],
    icks: [
      {
        id: 1,
        targetUserId: 4,
        targetUserName: 'Big Mike',
        authorUserId: 1,
        authorUserName: 'Kelly',
        text: 'Left the group chat on read and still claimed first chair energy all weekend.',
        createdAt: isoDate(-5),
      },
    ],
  }
}

function isoDate(daysOffset: number) {
  const date = new Date()
  date.setDate(date.getDate() + daysOffset)
  return date.toISOString()
}

function getCategoryId(slug: string) {
  const category = categoryBySlug.get(slug)
  if (!category) {
    throw new Error(`Missing mock category for slug "${slug}"`)
  }
  return category.id
}

function readStorage() {
  if (typeof window === 'undefined') return null

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as MockDb
  } catch {
    return null
  }
}

function writeStorage(db: MockDb) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
}

function normalizeState(db: MockDb): MockDb {
  return {
    ...db,
    nextIckId: db.nextIckId ?? 8000,
    icks: Array.isArray(db.icks) ? db.icks : [],
  }
}

let state: MockDb | null = null

function getState() {
  if (!state) {
    state = normalizeState(readStorage() ?? getInitialMockDb())
    writeStorage(state)
  }

  return state
}

function getUserName(userId: number) {
  return getState().users.find((user) => user.id === userId)?.name ?? 'Unknown rider'
}

function getCategoryBySlug(slug: string) {
  const category = categoryBySlug.get(slug)
  if (!category) throw new Error('category not found')
  return category
}

export function getMockCategoryMap() {
  return Object.fromEntries(categories.map((category) => [category.slug, category.id]))
}

export async function getMockCategories(): Promise<Category[]> {
  return categories.map(({ id, name, slug }) => ({ id, name, slug }))
}

export async function getMockUsers(): Promise<User[]> {
  return [...getState().users].sort((a, b) => a.name.localeCompare(b.name))
}

export async function getMockNomineesBySlug(
  slug: string,
  voterUserId?: number,
): Promise<CategoryPayload> {
  const category = getCategoryBySlug(slug)
  const db = getState()

  const nominees: Nominee[] = db.nominees
    .filter((entry) => entry.categoryId === category.id)
    .map((entry) => ({
      id: entry.id,
      nomineeUserId: entry.nomineeUserId,
      nomineeName: getUserName(entry.nomineeUserId),
      nominatedByUserId: entry.nominatedByUserId,
      nominatedByName: entry.nominatedByUserId ? getUserName(entry.nominatedByUserId) : null,
      votes: db.votes.filter((voteEntry) => voteEntry.nomineeId === entry.id).length,
    }))
    .sort((a, b) => b.votes - a.votes || a.nomineeName.localeCompare(b.nomineeName))

  return {
    category: { id: category.id, name: category.name, slug: category.slug },
    nominees,
    currentUserVoteNomineeId:
      voterUserId != null
        ? (db.votes.find((voteEntry) => {
            if (voteEntry.voterUserId !== voterUserId) return false

            const nomineeEntry = db.nominees.find((entry) => entry.id === voteEntry.nomineeId)
            return nomineeEntry?.categoryId === category.id
          })?.nomineeId ?? null)
        : null,
  }
}

export async function getMockMetricsBySlug(slug: string): Promise<MetricPayload> {
  const category = getCategoryBySlug(slug)
  const db = getState()

  const entries = db.users
    .map((user) => {
      const existingEntry = db.metricEntries.find(
        (entry) => entry.categoryId === category.id && entry.userId === user.id,
      )

      return {
        id: existingEntry?.id ?? -user.id,
        userId: user.id,
        userName: user.name,
        value: existingEntry?.value ?? 0,
        updatedAt: existingEntry?.updatedAt ?? null,
      }
    })
    .sort(
      (a, b) =>
        b.value - a.value ||
        (a.updatedAt ?? '').localeCompare(b.updatedAt ?? '') ||
        a.userName.localeCompare(b.userName),
    )

  return {
    category: { id: category.id, name: category.name, slug: category.slug },
    entries,
  }
}

export async function nominateMockBySlug(
  slug: string,
  nomineeUserId: number,
  nominatedByUserId: number,
) {
  const category = getCategoryBySlug(slug)
  const db = getState()

  const existing = db.nominees.find(
    (entry) => entry.categoryId === category.id && entry.nomineeUserId === nomineeUserId,
  )

  if (existing) {
    if (!existing.nominatedByUserId) {
      existing.nominatedByUserId = nominatedByUserId
      writeStorage(db)
    }

    return { id: existing.id }
  }

  const nextId = db.nextNomineeId++
  db.nominees.push({
    id: nextId,
    categoryId: category.id,
    nomineeUserId,
    nominatedByUserId,
  })
  writeStorage(db)

  return { id: nextId }
}

export async function voteMock(nomineeId: number, voterUserId: number) {
  const db = getState()
  const nominee = db.nominees.find((entry) => entry.id === nomineeId)

  if (!nominee) throw new Error('nominee not found')
  if (nominee.nomineeUserId === voterUserId) throw new Error('You cannot vote for yourself.')

  const duplicate = db.votes.some(
    (entry) =>
      entry.voterUserId === voterUserId &&
      db.nominees.find((nomineeEntry) => nomineeEntry.id === entry.nomineeId)?.categoryId ===
        nominee.categoryId,
  )

  if (!duplicate) {
    db.votes.push({ nomineeId, voterUserId })
    writeStorage(db)
  }

  return { ok: true, duplicate }
}

export async function upsertMockMetricBySlug(slug: string, userId: number, value: number) {
  const category = getCategoryBySlug(slug)
  const db = getState()
  const updatedAt = new Date().toISOString()

  const existingEntry = db.metricEntries.find(
    (entry) => entry.categoryId === category.id && entry.userId === userId,
  )

  if (existingEntry) {
    existingEntry.value = value
    existingEntry.updatedAt = updatedAt
    writeStorage(db)

    return { id: existingEntry.id, value: existingEntry.value, updatedAt }
  }

  const id = db.nextMetricId++
  db.metricEntries.push({
    id,
    categoryId: category.id,
    userId,
    value,
    updatedAt,
  })
  writeStorage(db)

  return { id, value, updatedAt }
}

export async function getMockIcks(authorUserId?: number): Promise<IckEntry[]> {
  const db = getState()
  const entries = authorUserId
    ? db.icks.filter((entry) => entry.authorUserId === authorUserId)
    : db.icks

  return [...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function createMockIck(targetUserId: number, authorUserId: number, text: string) {
  const db = getState()
  const trimmedText = text.trim()

  if (!trimmedText) {
    throw new Error('Please add an ick before saving.')
  }

  const targetUser = db.users.find((user) => user.id === targetUserId)
  if (!targetUser) {
    throw new Error('Selected rider not found.')
  }

  const authorUser = db.users.find((user) => user.id === authorUserId)
  if (!authorUser) {
    throw new Error('Current rider not found.')
  }

  const entry: IckEntry = {
    id: db.nextIckId++,
    targetUserId,
    targetUserName: targetUser.name,
    authorUserId,
    authorUserName: authorUser.name,
    text: trimmedText,
    createdAt: new Date().toISOString(),
  }

  db.icks.push(entry)
  writeStorage(db)

  return entry
}

export async function deleteMockIck(id: number, authorUserId: number) {
  const db = getState()
  const index = db.icks.findIndex((entry) => entry.id === id && entry.authorUserId === authorUserId)

  if (index === -1) {
    throw new Error('Ick not found.')
  }

  db.icks.splice(index, 1)
  writeStorage(db)

  return { id }
}
