<script setup lang="ts">
import HeroSection from '@/components/HeroSection.vue'
import CategoriesSection from '@/components/CategoriesSection.vue'
import CtaBlock from '@/components/CtaBlock.vue'
import { categories, loopMultiplier } from '@/data/categories'
import GameDescription from '@/components/GameDescription.vue'
</script>

<template>
  <main class="flex min-h-screen flex-col gap-16">
    <HeroSection />
    <GameDescription />
    <CategoriesSection :categories="categories" :loop-multiplier="loopMultiplier" />
    <CtaBlock />
  </main>
</template>
