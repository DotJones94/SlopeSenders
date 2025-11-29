<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import type { CategoryWithLoop } from '@/types/categories'
import MountainSilhouette from './MountainSilhouette.vue'

const mountainColors: { light: string[]; dark: string[] } = {
  light: ['#6366f1', '#8b5cf6', '#ec4899'], // pink, indigo, purple
  dark: ['#4338ca', '#6d28d9', '#be185d'], // dark pink, dark indigo, dark purple
}

const props = defineProps<{
  categories: CategoryWithLoop[]
  loopMultiplier: number
}>()

const carouselRefs = ref<Record<string, HTMLElement | null>>({})

const isComponentInstance = (value: unknown): value is ComponentPublicInstance =>
  !!value && typeof value === 'object' && '$el' in (value as Record<string, unknown>)

const resolveElement = (target: Element | ComponentPublicInstance | null): HTMLElement | null => {
  if (!target) return null
  if (target instanceof HTMLElement) return target
  if (isComponentInstance(target)) {
    return (target.$el as HTMLElement | null) ?? null
  }
  return null
}

const setCarouselRef = (id: string) => (el: Element | ComponentPublicInstance | null) => {
  carouselRefs.value[id] = resolveElement(el)
}

const initCarousel = (id: string) => {
  const el = carouselRefs.value[id]
  if (!el) return
  const singleWidth = el.scrollWidth / props.loopMultiplier
  el.scrollLeft = singleWidth
}

const handleScroll = (id: string) => {
  const el = carouselRefs.value[id]
  if (!el) return
  const singleWidth = el.scrollWidth / props.loopMultiplier
  const lowerBound = singleWidth * 0.4
  const upperBound = singleWidth * (props.loopMultiplier - 0.4)

  if (el.scrollLeft <= lowerBound) {
    el.scrollLeft += singleWidth
  } else if (el.scrollLeft >= upperBound) {
    el.scrollLeft -= singleWidth
  }
}

const getImageUrl = (imageName?: string): string | undefined => {
  if (!imageName) return undefined
  return new URL(`../assets/images/${imageName}`, import.meta.url).href
}

const getCategoryColor = (index: number): string => {
  return mountainColors.light[index % mountainColors.light.length] || '#60a5fa'
}

const getCategoryColorDark = (index: number): string => {
  return mountainColors.dark[index % mountainColors.dark.length] || '#60a5fa'
}

onMounted(() => {
  nextTick(() => {
    props.categories.forEach((category) => initCarousel(category.id))
  })
})
</script>

<template>
  <section class="flex flex-col gap-12">
    <div
      v-for="(category, index) in categories"
      :key="category.id"
      class="relative pb-8 my-8"
      :style="{
        backgroundColor: `${getCategoryColor(index)}`,
        backgroundImage: 'linear-gradient(0deg, black 0%, transparent 30%)',
      }"
    >
      <MountainSilhouette
        :color="getCategoryColor(index)"
        :colorDark="getCategoryColorDark(index)"
        :flipped="index % 2 === 1"
        class="absolute -top-[119px] -mb-20 left-0 right-0"
      />
      <header class="relative z-10 space-y-3 px-12 sm:px-24 lg:px-32">
        <p
          class="text-xs font-semibold uppercase tracking-[0.2em]"
          :style="{ color: getCategoryColorDark(index) }"
        >
          {{ category.id }}
        </p>
        <h2 class="text-3xl font-semibold text-white">{{ category.title }}</h2>
        <p class="max-w-xl text-base leading-relaxed text-white/80">{{ category.blurb }}</p>
      </header>

      <div
        class="mt-8 flex gap-6 overflow-x-auto overflow-y-visible px-6 pt-[50px] pb-16 sm:px-12 sm:pb-16 lg:px-20 lg:pb-16 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [scroll-padding-inline:1.5rem] sm:[scroll-padding-inline:3rem] lg:[scroll-padding-inline:5rem]"
        :ref="setCarouselRef(category.id)"
        @scroll.passive="handleScroll(category.id)"
        role="list"
      >
        <article
          v-for="(tile, tileIndex) in category.loopedTiles"
          :key="tile.loopKey"
          class="shrink-0 basis-[clamp(240px,22vw,340px)] snap-center overflow-visible"
          role="listitem"
        >
          <div
            class="relative min-h-[310px] overflow-visible rounded-[2.2rem] bg-white p-6 shadow-lg"
          >
            <!-- Large faint index number in background -->
            <div class="absolute inset-0 flex items-end justify-end pr-8 pb-8 pointer-events-none">
              <span class="text-[120px] font-bold text-gray-200/40 leading-none">
                {{ (tileIndex % category.tiles.length) + 1 }}
              </span>
            </div>

            <!-- Image at the top -->
            <div v-if="tile.image" class="relative z-10 -mt-[84px] mb-6 flex justify-center">
              <div class="h-48 w-48">
                <img
                  :src="getImageUrl(tile.image)"
                  :alt="tile.title"
                  class="h-full w-full object-contain"
                  style="filter: drop-shadow(0 10px 25px rgba(0, 0, 0, 0.15))"
                />
              </div>
            </div>

            <!-- Text content below image -->
            <div class="relative z-10 flex flex-col gap-1">
              <p class="text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-400">
                {{ tile.header }}
              </p>
              <h2 class="text-2xl font-bold text-gray-800">{{ tile.title }}</h2>
              <p class="text-sm font-normal text-gray-600">{{ tile.description }}</p>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
