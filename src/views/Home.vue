<script setup lang="ts">
import HeroSection from '@/components/HeroSection.vue'
import CategoriesSection from '@/components/CategoriesSection.vue'
import CtaBlock from '@/components/CtaBlock.vue'
import { loopMultiplier } from '@/data/categories'
import GameDescription from '@/components/GameDescription.vue'
import { getMockCategoryMap } from '@/mockApi'

import { ref, onMounted } from 'vue'
import { categories as staticCategories } from '@/data/categories'

const categories = ref(staticCategories)
const useFakeData = import.meta.env.VITE_USE_FAKE_DATA === 'true'

onMounted(async () => {
  const map = useFakeData
    ? getMockCategoryMap()
    : await fetch('/.netlify/functions/category-map').then((res) => res.json())

  // attach db ids to tiles
  categories.value = categories.value.map((section) => ({
    ...section,
    tiles: section.tiles.map((tile) => ({
      ...tile,
      dbCategoryId:
        map[`${section.id.toLowerCase()}-${tile.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`],
    })),
  }))
})
</script>

<template>
  <main class="flex min-h-screen flex-col gap-16">
    <HeroSection />
    <GameDescription />
    <CategoriesSection :categories="categories" :loop-multiplier="loopMultiplier" />
    <CtaBlock />
  </main>
</template>
