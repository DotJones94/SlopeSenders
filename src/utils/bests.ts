import { baseCategories } from '@/data/categories'
import { getCategorySlug } from '@/utils/metrics'

export const BESTS_VOTES_UPDATED_EVENT = 'slopesenders:bests-votes-updated'

export function getBestCategories() {
  const bestsSection = baseCategories.find((category) => category.id === 'bests')

  if (!bestsSection) {
    return []
  }

  return bestsSection.tiles.map((tile) => ({
    ...tile,
    slug: getCategorySlug(bestsSection.id, tile.title),
  }))
}

export function dispatchBestsVotesUpdatedEvent() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(BESTS_VOTES_UPDATED_EVENT))
}
