import type { Category, CategoryWithLoop } from '@/types/categories'
export { baseCategories } from './baseCategories.js'
import { baseCategories } from './baseCategories.js'

export const loopMultiplier = 3

const slugify = (str: string) =>
  str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

export const categories: CategoryWithLoop[] = baseCategories.map((category) => {
  const looped = Array.from({ length: loopMultiplier }, (_, loopIndex) =>
    category.tiles.map((tile, tileIndex) => ({
      ...tile,
      slug: `${slugify(category.id)}-${slugify(tile.title)}`,
      loopKey: `${category.id}-${loopIndex}-${tileIndex}`,
    })),
  ).flat()

  return { ...category, loopedTiles: looped }
})
