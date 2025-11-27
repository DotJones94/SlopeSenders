<script setup lang="ts">
import HeroSection from '@/components/HeroSection.vue'
import CategoriesSection from '@/components/CategoriesSection.vue'
import CtaBlock from '@/components/CtaBlock.vue'
import { categories, loopMultiplier } from '@/data/categories'
</script>

<template>
  <main
    class="flex min-h-screen flex-col gap-16 bg-[radial-gradient(circle_at_top_left,_#0f0624,_#02000c)]"
  >
    <HeroSection />
    <CategoriesSection :categories="categories" :loop-multiplier="loopMultiplier" />
    <CtaBlock />
  </main>
</template>
