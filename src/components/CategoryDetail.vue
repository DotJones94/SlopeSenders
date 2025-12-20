<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getNomineesBySlug, nominateBySlug, vote } from '@/api'
import { baseCategories } from '@/data/categories'

const route = useRoute()
const router = useRouter()

const slug = computed(() => route.params.slug as string)

const loading = ref(true)
const submitting = ref(false)
const votingId = ref<number | null>(null)

const error = ref<string | null>(null)

type Nominee = { id: number; name: string; votes: number }
type CategoryPayload = {
  category: { id: number; name: string; slug: string }
  nominees: Nominee[]
}

const categoryData = ref<CategoryPayload | null>(null)
const nomineeName = ref('')

// Local slugify that matches your DB seeding
const slugify = (str: string) =>
  str
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

// Find the tile that matches this slug
const tile = computed(() => {
  for (const category of baseCategories) {
    const foundTile = category.tiles.find((t) => {
      const expectedSlug = `${slugify(category.id)}-${slugify(t.title)}`
      return expectedSlug === slug.value
    })
    if (foundTile) return { ...foundTile, category }
  }
  return null
})

async function load() {
  error.value = null
  loading.value = true
  categoryData.value = null

  // If the URL slug doesn't correspond to any tile, stop here
  if (!tile.value) {
    error.value = 'Category not found (invalid URL).'
    loading.value = false
    return
  }

  try {
    const data = await getNomineesBySlug(slug.value)

    // Defensive check in case API returns something unexpected
    if (!data?.category || !Array.isArray(data?.nominees)) {
      throw new Error('Unexpected API response')
    }

    categoryData.value = data
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load nominees'
  } finally {
    loading.value = false
  }
}

async function submitNominee() {
  if (!nomineeName.value.trim()) return
  if (!tile.value) return

  submitting.value = true
  error.value = null

  try {
    await nominateBySlug(slug.value, nomineeName.value.trim())
    nomineeName.value = ''
    await load()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to nominate'
  } finally {
    submitting.value = false
  }
}

async function castVote(nomineeId: number) {
  votingId.value = nomineeId
  error.value = null

  try {
    await vote(nomineeId)
    await load()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to vote'
  } finally {
    votingId.value = null
  }
}

onMounted(load)
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-gray-50 to-white">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
        <p v-if="tile?.category?.title" class="text-sm text-gray-500 mt-2">
          {{ tile.category.title }}
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
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <p class="text-red-800">{{ error }}</p>
      </div>

      <!-- Nomination box -->
      <div
        v-if="!loading && tile"
        class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6"
      >
        <h2 class="text-sm font-semibold text-gray-900 mb-3">Nominate someone</h2>

        <form @submit.prevent="submitNominee" class="flex gap-2">
          <input
            v-model="nomineeName"
            type="text"
            placeholder="Enter a name"
            class="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20"
            :disabled="submitting"
          />
          <button
            type="submit"
            class="rounded-md bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
            :disabled="submitting || !nomineeName.trim()"
          >
            {{ submitting ? 'Adding...' : 'Nominate' }}
          </button>
        </form>

        <p class="text-xs text-gray-500 mt-2">
          Tip: nominations are unique per category (no duplicates).
        </p>
      </div>

      <!-- Nominees Table -->
      <div
        v-if="!loading && categoryData"
        class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
      >
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
              <th scope="col" class="px-6 py-3"></th>
            </tr>
          </thead>

          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="(nominee, index) in categoryData.nominees"
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
              <td class="px-6 py-4 whitespace-nowrap text-right">
                <button
                  class="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100 disabled:opacity-50"
                  @click="castVote(nominee.id)"
                  :disabled="votingId === nominee.id"
                >
                  {{ votingId === nominee.id ? 'Voting...' : 'Vote' }}
                </button>
              </td>
            </tr>

            <tr v-if="categoryData.nominees.length === 0">
              <td colspan="4" class="px-6 py-8 text-center text-sm text-gray-500">
                No nominees yet. Be the first to nominate someone!
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
