import { baseCategories } from '@/data/categories'

export const METRICS_UPDATED_EVENT = 'slopesenders:metrics-updated'

export function slugifyMetricValue(str: string) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function getCategorySlug(sectionId: string, title: string) {
  return `${slugifyMetricValue(sectionId)}-${slugifyMetricValue(title)}`
}

export function getMetricUnitLabel(title: string) {
  const normalizedTitle = title.toLowerCase()

  if (normalizedTitle.includes('days')) return 'days'
  if (normalizedTitle.includes('runs')) return 'runs'
  if (normalizedTitle.includes('vertical')) return 'vertical meters'
  if (normalizedTitle.includes('resorts')) return 'resorts'
  if (normalizedTitle.includes('speed')) return 'km/h'

  return 'total'
}

export function getMetricCategories() {
  const metricsSection = baseCategories.find((category) => category.id === 'metrics')

  if (!metricsSection) {
    return []
  }

  return metricsSection.tiles.map((tile) => ({
    ...tile,
    slug: getCategorySlug(metricsSection.id, tile.title),
    unitLabel: getMetricUnitLabel(tile.title),
  }))
}

export function sanitizeMetricInput(rawValue: string) {
  const cleanedValue = rawValue.replace(/[^\d.]/g, '')
  const [wholePart = '', ...decimalParts] = cleanedValue.split('.')

  if (decimalParts.length === 0) {
    return wholePart
  }

  return `${wholePart}.${decimalParts.join('')}`
}

export function dispatchMetricsUpdatedEvent() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(METRICS_UPDATED_EVENT))
}
