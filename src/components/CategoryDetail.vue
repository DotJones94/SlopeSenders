<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getNominees } from '@/api'
import { baseCategories } from '@/data/categories'

const route = useRoute()
const router = useRouter()

const slug = computed(() => route.params.slug as string)
const nominees = ref<Array<{ id: number; name: string; votes: number }>>([])
const loading = ref(true)
const error = ref<string | null>(null)
const categoryMap = ref<Record<string, number>>({})
const dbCategoryId = ref<number | null>(null)

// Find the tile that matches this slug
const tile = computed(() => {
  for (const category of baseCategories) {
    const foundTile = category.tiles.find((t) => {
      const slugify = (str: string) =>
        str
          .toLowerCase()
          .trim()
          .replace(/['"]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
      const expectedSlug = `${slugify(category.id)}-${slugify(t.title)}`
      return expectedSlug === slug.value
    })
    if (foundTile) {
      return { ...foundTile, category }
    }
  }
  return null
})

const category = computed(() => {
  return tile.value?.category
})

onMounted(async () => {
  try {
    loading.value = true

    // Fetch category map to get the database category ID from slug
    const mapRes = await fetch('/.netlify/functions/category-map')
    categoryMap.value = await mapRes.json()

    dbCategoryId.value = categoryMap.value[slug.value]

    if (!dbCategoryId.value) {
      error.value = 'Category not found'
      return
    }

    // Fetch nominees using the database category ID
    const data = await getNominees(dbCategoryId.value)
    nominees.value = data
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load nominees'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-gray-50 to-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <!-- Back button -->
      <button
        @click="router.push('/')"
        class="mb-8 text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2"
      >
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Categories
      </button>

      <!-- Category Header -->
      <div class="mb-8">
        <h1 class="text-4xl font-bold text-gray-900 mb-2">{{ tile?.header }} {{ tile?.title }}</h1>
        <p class="text-lg text-gray-600">{{ tile?.description }}</p>
        <p v-if="category" class="text-sm text-gray-500 mt-2">
          {{ category.title }}
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <div
          class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"
        ></div>
        <p class="mt-4 text-gray-600">Loading nominees...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
        <p class="text-red-800">{{ error }}</p>
      </div>

      <!-- Nominees Table -->
      <div v-else class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Rank
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Nominee
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Votes
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="(nominee, index) in nominees"
              :key="nominee.id"
              class="hover:bg-gray-50 transition-colors"
            >
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {{ index + 1 }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ nominee.name }}
              </td>
              <td
                class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold"
              >
                {{ nominee.votes }}
              </td>
            </tr>
            <tr v-if="nominees.length === 0">
              <td colspan="3" class="px-6 py-8 text-center text-sm text-gray-500">
                No nominees yet. Be the first to nominate someone!
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
