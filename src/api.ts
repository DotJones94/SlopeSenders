export interface Category {
  id: number
  name: string
  slug: string
}

export interface User {
  id: number
  name: string
}

export interface Nominee {
  id: number
  nomineeUserId: number
  nomineeName: string
  nominatedByUserId: number | null
  nominatedByName: string | null
  votes: number
}

export interface CategoryPayload {
  category: Category
  nominees: Nominee[]
}

export interface MetricEntry {
  id: number
  userId: number
  userName: string
  value: number
  updatedAt: string | null
}

export interface MetricPayload {
  category: Category
  entries: MetricEntry[]
}

import {
  getMockCategories,
  getMockMetricsBySlug,
  getMockNomineesBySlug,
  getMockUsers,
  nominateMockBySlug,
  upsertMockMetricBySlug,
  voteMock,
} from '@/mockApi'

const USE_FAKE_DATA = import.meta.env.VITE_USE_FAKE_DATA === 'true'

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init)
  const text = await res.text()
  const contentType = res.headers.get('content-type') ?? ''
  const isJson = contentType.includes('application/json')
  const data = text && isJson ? JSON.parse(text) : null

  if (!res.ok) {
    const message =
      data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
        ? data.error
        : `Request to ${input} failed with status ${res.status}${text ? `: ${text.slice(0, 120)}` : ''}`
    throw new Error(message)
  }

  if (text && !isJson) {
    throw new Error(
      `Expected JSON from ${input}, but received ${contentType || 'unknown content type'}: ${text.slice(0, 120)}`,
    )
  }

  return data as T
}

export async function getCategories(): Promise<Category[]> {
  if (USE_FAKE_DATA) {
    return getMockCategories()
  }

  return request('/.netlify/functions/categories')
}

export async function getUsers(): Promise<User[]> {
  if (USE_FAKE_DATA) {
    return getMockUsers()
  }

  return request('/.netlify/functions/users')
}

export async function getNomineesBySlug(slug: string): Promise<CategoryPayload> {
  if (USE_FAKE_DATA) {
    return getMockNomineesBySlug(slug)
  }

  return request(`/.netlify/functions/nominees-by-slug?slug=${encodeURIComponent(slug)}`)
}

export async function getMetricsBySlug(slug: string): Promise<MetricPayload> {
  if (USE_FAKE_DATA) {
    return getMockMetricsBySlug(slug)
  }

  return request(`/.netlify/functions/metrics-by-slug?slug=${encodeURIComponent(slug)}`)
}

export async function nominateBySlug(
  slug: string,
  nomineeUserId: number,
  nominatedByUserId: number,
): Promise<{ id: number }> {
  if (USE_FAKE_DATA) {
    return nominateMockBySlug(slug, nomineeUserId, nominatedByUserId)
  }

  return request('/.netlify/functions/nominate-by-slug', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ slug, nomineeUserId, nominatedByUserId }),
  })
}

export async function vote(
  nomineeId: number,
  voterUserId: number,
): Promise<{ ok: boolean; duplicate?: boolean }> {
  if (USE_FAKE_DATA) {
    return voteMock(nomineeId, voterUserId)
  }

  return request('/.netlify/functions/vote', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ nomineeId, voterUserId }),
  })
}

export async function upsertMetricBySlug(
  slug: string,
  userId: number,
  value: number,
): Promise<{ id: number; value: number; updatedAt: string }> {
  if (USE_FAKE_DATA) {
    return upsertMockMetricBySlug(slug, userId, value)
  }

  return request('/.netlify/functions/upsert-metric-by-slug', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ slug, userId, value }),
  })
}
