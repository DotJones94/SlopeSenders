<script setup lang="ts">
import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getMetricsBySlug,
  getNomineesBySlug,
  nominateBySlug,
  upsertMetricBySlug,
  vote,
} from '@/api'
import type { MetricEntry, MetricPayload } from '@/api'
import { baseCategories } from '@/data/categories'
import { useSessionUserStore } from '@/stores/sessionUser'
import { BESTS_VOTES_UPDATED_EVENT } from '@/utils/bests'
import {
  dispatchMetricsUpdatedEvent,
  getCategorySlug,
  getMetricUnitLabel,
  sanitizeMetricInput,
} from '@/utils/metrics'
import { getProfilePicUrl } from '@/utils/profilePics'

const route = useRoute()
const router = useRouter()
const sessionUser = useSessionUserStore()

const slug = computed(() => route.params.slug as string)

const loading = ref(true)
const submitting = ref(false)
const votingId = ref<number | null>(null)
const selectedNomineeUserId = ref<number | null>(null)
const metricValue = ref('')

const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const expandedProfile = ref<{ name: string; imageUrl: string } | null>(null)

type Nominee = {
  id: number
  nomineeUserId: number
  nomineeName: string
  nominatedByUserId: number | null
  nominatedByName: string | null
  votes: number
}

type CategoryPayload = {
  category: { id: number; name: string; slug: string }
  nominees: Nominee[]
  currentUserVoteNomineeId: number | null
}

const categoryData = ref<CategoryPayload | null>(null)
const metricData = ref<MetricPayload | null>(null)

const currentUserName = computed(() => sessionUser.currentUser?.name ?? 'Choose rider')

const getImageUrl = (imageName?: string): string | undefined => {
  if (!imageName) return undefined
  return new URL(`../assets/images/${imageName}`, import.meta.url).href
}

const tile = computed(() => {
  for (const category of baseCategories) {
    const foundTile = category.tiles.find((t) => {
      const expectedSlug = getCategorySlug(category.id, t.title)
      return expectedSlug === slug.value
    })
    if (foundTile) return { ...foundTile, category }
  }
  return null
})

const isMetricsCategory = computed(() => tile.value?.category.id === 'metrics')
const currentUserVoteNomineeId = computed(() => categoryData.value?.currentUserVoteNomineeId ?? null)

const availableNomineeUsers = computed(() =>
  sessionUser.users.filter(
    (user) => !categoryData.value?.nominees.some((nominee) => nominee.nomineeUserId === user.id),
  ),
)

const currentUserMetricEntry = computed(() => {
  if (!sessionUser.currentUserId) return null
  return (
    metricData.value?.entries.find((entry) => entry.userId === sessionUser.currentUserId) ?? null
  )
})

const metricUnitLabel = computed(() => {
  return getMetricUnitLabel(tile.value?.title ?? '')
})

const canSubmitMetric = computed(() => {
  if (!sessionUser.currentUserId) return false
  const rawValue = String(metricValue.value ?? '').trim()
  if (!rawValue) return false

  const parsedValue = Number(rawValue)
  return Number.isFinite(parsedValue) && parsedValue >= 0
})

function formatMetricValue(value: number) {
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue)) {
    return '0'
  }

  return Number.isInteger(numericValue) ? String(numericValue) : numericValue.toFixed(2)
}

function resetFlashMessages() {
  error.value = null
  successMessage.value = null
}

function handleMetricInput(event: Event) {
  const target = event.target as HTMLInputElement
  const sanitizedValue = sanitizeMetricInput(target.value)
  metricValue.value = sanitizedValue
  target.value = sanitizedValue
}

async function load() {
  resetFlashMessages()
  loading.value = true
  categoryData.value = null
  metricData.value = null

  if (!tile.value) {
    error.value = 'Category not found (invalid URL).'
    loading.value = false
    return
  }

  try {
    if (isMetricsCategory.value) {
      const data = await getMetricsBySlug(slug.value)

      if (!data?.category || !Array.isArray(data?.entries)) {
        throw new Error('Unexpected metrics API response')
      }

      metricData.value = data
      metricValue.value = currentUserMetricEntry.value
        ? String(currentUserMetricEntry.value.value)
        : ''
    } else {
      const data = await getNomineesBySlug(slug.value, sessionUser.currentUserId)

      if (!data?.category || !Array.isArray(data?.nominees)) {
        throw new Error('Unexpected API response')
      }

      categoryData.value = data
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load category data'
  } finally {
    loading.value = false
  }
}

async function submitMetric() {
  if (!sessionUser.currentUserId) return

  const parsedValue = Number(metricValue.value)
  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    error.value = 'Please enter a valid non-negative number.'
    return
  }

  submitting.value = true
  resetFlashMessages()

  try {
    await upsertMetricBySlug(slug.value, sessionUser.currentUserId, parsedValue)
    dispatchMetricsUpdatedEvent()
    successMessage.value = 'Your stat has been updated.'
    await load()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to update your stat'
  } finally {
    submitting.value = false
  }
}

async function submitNominee() {
  if (!selectedNomineeUserId.value || !sessionUser.currentUserId) return

  submitting.value = true
  resetFlashMessages()

  try {
    await nominateBySlug(slug.value, selectedNomineeUserId.value, sessionUser.currentUserId)
    successMessage.value = 'Nomination saved.'
    selectedNomineeUserId.value = null
    await load()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to nominate'
  } finally {
    submitting.value = false
  }
}

async function castVote(nomineeId: number) {
  if (!sessionUser.currentUserId) return

  votingId.value = nomineeId
  resetFlashMessages()

  try {
    const result = await vote(nomineeId, sessionUser.currentUserId)
    successMessage.value = result.duplicate
      ? 'You already voted for this nominee.'
      : 'Vote counted.'
    await load()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to vote'
  } finally {
    votingId.value = null
  }
}

function voteLabel(nominee: Nominee) {
  if (votingId.value === nominee.id) return 'Voting...'
  if (nominee.nomineeUserId === sessionUser.currentUserId) return 'Your nomination'
  if (currentUserVoteNomineeId.value === nominee.id) return 'Voted'
  if (currentUserVoteNomineeId.value) return 'Already voted'
  return 'Vote'
}

function handleCategoryDataUpdated() {
  load()
}

watch(
  () => categoryData.value,
  () => {
    if (
      selectedNomineeUserId.value &&
      categoryData.value?.nominees.some(
        (nominee) => nominee.nomineeUserId === selectedNomineeUserId.value,
      )
    ) {
      selectedNomineeUserId.value = null
    }
  },
)

watch(currentUserMetricEntry, (entry) => {
  if (isMetricsCategory.value) {
    metricValue.value = entry ? String(entry.value) : ''
  }
})

onMounted(async () => {
  await sessionUser.loadUsers()
  await load()
  window.addEventListener(BESTS_VOTES_UPDATED_EVENT, handleCategoryDataUpdated)
})

onBeforeUnmount(() => {
  window.removeEventListener(BESTS_VOTES_UPDATED_EVENT, handleCategoryDataUpdated)
})

function openExpandedProfile() {
  expandedProfile.value = {
    name: currentUserName.value,
    imageUrl: getProfilePicUrl(currentUserName.value),
  }
}

function closeExpandedProfile() {
  expandedProfile.value = null
}

function openProfilePopup(name: string) {
  expandedProfile.value = {
    name,
    imageUrl: getProfilePicUrl(name),
  }
}
</script>

<template>
  <div
    class="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.22),_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_45%,_#ffffff_100%)]"
  >
    <div class="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <button
        @click="router.push({ path: '/', hash: `#${tile?.category?.id ?? ''}` })"
        class="mb-6 flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 sm:mb-8"
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

      <div class="mb-8 grid gap-6 lg:grid-cols-[minmax(0,1fr),320px]">
        <div
          class="relative overflow-hidden rounded-[2rem] bg-slate-950 px-6 pb-6 pt-8 text-white shadow-[0_24px_80px_rgba(15,23,42,0.28)] sm:px-8"
        >
          <div
            class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.26),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(129,140,248,0.28),_transparent_32%)]"
          ></div>
          <div
            class="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div class="max-w-2xl">
              <p class="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">
                {{ tile?.category?.title }}
              </p>
              <h1 class="mt-3 text-3xl font-semibold leading-tight text-white sm:text-5xl">
                {{ tile?.header }} {{ tile?.title }}
              </h1>
              <p class="mt-4 max-w-xl text-sm leading-6 text-slate-200 sm:text-base">
                {{ tile?.description }}
              </p>
            </div>

            <div
              v-if="tile?.image"
              class="mx-auto flex h-40 w-40 shrink-0 items-center justify-center sm:mx-0 sm:h-48 sm:w-48"
            >
              <img
                :src="getImageUrl(tile.image)"
                :alt="tile.title"
                class="h-full w-full object-contain"
                style="filter: drop-shadow(0 16px 30px rgba(15, 23, 42, 0.45))"
              />
            </div>
          </div>
        </div>

        <div
          class="rounded-[1.75rem] border border-white/60 bg-white/90 p-5 shadow-[0_20px_60px_rgba(148,163,184,0.18)] backdrop-blur"
        >
          <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Current rider
          </p>
          <div class="mt-3 flex items-center gap-4 rounded-2xl bg-slate-950 px-4 py-4 text-white">
            <button
              type="button"
              class="rounded-2xl transition hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-cyan-300/70"
              @click="openProfilePopup(currentUserName)"
            >
              <img
                :src="getProfilePicUrl(currentUserName)"
                :alt="currentUserName"
                class="h-16 w-16 rounded-2xl object-cover ring-1 ring-white/10"
              />
            </button>
            <div>
              <p class="text-lg font-semibold">{{ currentUserName }}</p>
              <p class="mt-1 text-sm text-slate-300">
                Locked in for this device. Choose wisely and ride it out.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Teleport to="body">
        <div
          v-if="expandedProfile"
          class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm"
          @click="closeExpandedProfile"
        >
          <div class="rounded-[2rem] bg-white p-3 shadow-2xl shadow-slate-950/40" @click.stop>
            <img
              :src="expandedProfile.imageUrl"
              :alt="expandedProfile.name"
              class="h-[min(70vh,26rem)] w-[min(90vw,26rem)] rounded-[1.5rem] object-cover"
            />
            <p class="px-2 pb-2 pt-4 text-center text-base font-semibold text-slate-900">
              {{ expandedProfile.name }}
            </p>
          </div>
        </div>
      </Teleport>

      <div v-if="loading" class="text-center py-12">
        <div
          class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"
        ></div>
        <p class="mt-4 text-gray-600">
          {{ isMetricsCategory ? 'Loading leaderboard...' : 'Loading nominees...' }}
        </p>
      </div>

      <div v-else-if="error" class="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
        <p class="text-red-800">{{ error }}</p>
      </div>

      <div
        v-if="successMessage"
        class="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4"
      >
        <p class="text-emerald-800">{{ successMessage }}</p>
      </div>

      <div
        v-if="!loading && tile && isMetricsCategory"
        class="mb-8 rounded-[1.9rem] border border-white/60 bg-white/95 p-5 shadow-[0_20px_60px_rgba(148,163,184,0.18)] sm:p-6"
      >
        <div class="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 class="text-lg font-semibold text-slate-900">Update your number</h2>
            <p class="text-sm text-slate-500">
              Only your own {{ metricUnitLabel }} can be edited from this device.
            </p>
          </div>
          <p v-if="currentUserMetricEntry" class="text-sm font-medium text-slate-500">
            Current total: {{ formatMetricValue(currentUserMetricEntry.value) }}
            {{ metricUnitLabel }}
          </p>
        </div>

        <form @submit.prevent="submitMetric" class="flex flex-col gap-3 sm:flex-row">
          <input
            v-model="metricValue"
            type="number"
            min="0"
            step="0.01"
            inputmode="decimal"
            @input="handleMetricInput"
            :placeholder="`Enter your ${metricUnitLabel}`"
            class="min-h-12 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
            :disabled="submitting || !sessionUser.currentUserId"
          />
          <button
            type="submit"
            class="min-h-12 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 sm:min-w-40"
            :disabled="submitting || !canSubmitMetric"
          >
            {{ submitting ? 'Saving...' : 'Update Stat' }}
          </button>
        </form>
      </div>

      <div
        v-else-if="!loading && tile"
        class="mb-8 rounded-[1.9rem] border border-white/60 bg-white/95 p-5 shadow-[0_20px_60px_rgba(148,163,184,0.18)] sm:p-6"
      >
        <div class="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 class="text-lg font-semibold text-slate-900">Nominate someone</h2>
            <p class="text-sm text-slate-500">
              Pick from the crew list. Each rider can only appear once in this category.
            </p>
          </div>
        </div>

        <form @submit.prevent="submitNominee" class="flex flex-col gap-3 sm:flex-row">
          <select
            v-model="selectedNomineeUserId"
            class="min-h-12 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
            :disabled="submitting || !sessionUser.currentUserId"
          >
            <option :value="null">Choose a rider</option>
            <option v-for="user in availableNomineeUsers" :key="user.id" :value="user.id">
              {{ user.name }}
            </option>
          </select>
          <button
            type="submit"
            class="min-h-12 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 sm:min-w-36"
            :disabled="submitting || !selectedNomineeUserId || !sessionUser.currentUserId"
          >
            {{ submitting ? 'Adding...' : 'Nominate' }}
          </button>
        </form>

        <p class="mt-3 text-xs text-slate-500">
          You can nominate yourself or someone else, but each rider can only appear once per
          category.
        </p>

        <p
          v-if="currentUserVoteNomineeId"
          class="mt-3 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-900"
        >
          Your vote for this category has already been locked in.
        </p>
      </div>

      <div
        v-if="!loading && isMetricsCategory && metricData"
        class="overflow-hidden rounded-[2rem] border border-white/60 bg-white/95 shadow-[0_20px_60px_rgba(148,163,184,0.18)]"
      >
        <div
          class="hidden grid-cols-[120px,minmax(0,1.5fr),180px] gap-4 border-b border-slate-200 bg-slate-50 px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 md:grid"
        >
          <div></div>
          <div>Rider</div>
          <div class="text-center">Reported</div>
        </div>

        <article
          v-for="(entry, index) in metricData.entries"
          :key="entry.id"
          class="border-b border-slate-200 last:border-b-0"
          :class="entry.userId === sessionUser.currentUserId ? 'bg-cyan-50/80' : ''"
        >
          <div
            class="hidden items-center gap-4 px-6 py-5 md:grid md:grid-cols-[120px,minmax(0,1.5fr),180px]"
          >
            <div class="relative flex items-center gap-3">
              <div
                class="absolute -left-2 top-1/2 -translate-y-1/2 text-[72px] font-black leading-none text-slate-200"
              >
                {{ index + 1 }}
              </div>
              <button
                type="button"
                class="relative z-10 ml-8 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-300/70"
                @click="openProfilePopup(entry.userName)"
              >
                <img
                  :src="getProfilePicUrl(entry.userName)"
                  :alt="entry.userName"
                  class="h-14 w-14 rounded-2xl object-cover"
                />
              </button>
            </div>

            <div class="min-w-0">
              <p class="truncate text-lg font-semibold text-slate-900">{{ entry.userName }}</p>
            </div>

            <div class="text-center">
              <span
                class="inline-flex min-w-24 items-baseline justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-slate-900"
              >
                <span class="text-lg font-bold">{{ formatMetricValue(entry.value) }}</span>
                <span class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {{ metricUnitLabel }}
                </span>
              </span>
            </div>
          </div>

          <div class="space-y-4 px-4 py-5 sm:px-5 md:hidden">
            <div class="flex items-start gap-4">
              <div class="relative flex w-14 shrink-0 justify-center">
                <div
                  class="absolute left-0 top-1/2 -translate-y-1/2 text-[56px] font-black leading-none text-slate-200"
                >
                  {{ index + 1 }}
                </div>
              </div>
              <button
                type="button"
                class="shrink-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-300/70"
                @click="openProfilePopup(entry.userName)"
              >
                <img
                  :src="getProfilePicUrl(entry.userName)"
                  :alt="entry.userName"
                  class="h-16 w-16 rounded-2xl object-cover"
                />
              </button>
              <div class="min-w-0 flex-1 pt-1">
                <p class="text-lg font-semibold text-slate-900">{{ entry.userName }}</p>
              </div>
            </div>

            <div class="rounded-2xl bg-slate-950 px-4 py-3 text-white">
              <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">
                Reported
              </p>
              <div class="mt-2 flex items-end gap-2">
                <p class="text-2xl font-bold leading-none">
                  {{ formatMetricValue(entry.value) }}
                </p>
                <p class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
                  {{ metricUnitLabel }}
                </p>
              </div>
            </div>
          </div>
        </article>

        <div v-if="metricData.entries.length === 0" class="p-10 text-center text-sm text-slate-500">
          No one has reported their number yet. Be the first.
        </div>
      </div>

      <div
        v-else-if="!loading && categoryData"
        class="overflow-hidden rounded-[2rem] border border-white/60 bg-white/95 shadow-[0_20px_60px_rgba(148,163,184,0.18)]"
      >
        <div
          class="hidden grid-cols-[84px,minmax(0,1.5fr),minmax(0,1fr),120px,140px] gap-4 border-b border-slate-200 bg-slate-50 px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 md:grid"
        >
          <div>Rank</div>
          <div>Nominee</div>
          <div>Nominated By</div>
          <div class="text-center">Votes</div>
          <div class="text-right">Action</div>
        </div>

        <article
          v-for="(nominee, index) in categoryData.nominees"
          :key="nominee.id"
          class="border-b border-slate-200 last:border-b-0"
        >
          <div
            class="hidden items-center gap-4 px-6 py-5 md:grid md:grid-cols-[84px,minmax(0,1.5fr),minmax(0,1fr),120px,140px]"
          >
            <div class="flex items-center gap-3">
              <div
                class="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-lg font-bold text-white"
              >
                {{ index + 1 }}
              </div>
              <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <button
                  type="button"
                  class="rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-300/70"
                  @click="openProfilePopup(nominee.nomineeName)"
                >
                  <img
                    :src="getProfilePicUrl(nominee.nomineeName)"
                    :alt="nominee.nomineeName"
                    class="h-14 w-14 rounded-2xl object-cover"
                  />
                </button>
              </div>
            </div>

            <div class="min-w-0">
              <p class="truncate text-lg font-semibold text-slate-900">{{ nominee.nomineeName }}</p>
              <p class="mt-1 text-sm text-slate-500">{{ tile?.header }} {{ tile?.title }}</p>
            </div>

            <div class="min-w-0">
              <p class="truncate text-sm font-medium text-slate-700">
                {{ nominee.nominatedByName ?? 'Unknown' }}
              </p>
              <p
                v-if="nominee.nomineeUserId === sessionUser.currentUserId"
                class="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-600"
              >
                You are this nominee
              </p>
            </div>

            <div class="text-center">
              <span
                class="inline-flex min-w-16 items-center justify-center rounded-2xl bg-slate-100 px-4 py-3 text-lg font-bold text-slate-900"
              >
                {{ nominee.votes }}
              </span>
            </div>

            <div class="flex justify-end">
              <button
                class="min-h-11 rounded-2xl px-4 py-2 text-sm font-semibold transition"
                :class="
                  nominee.nomineeUserId === sessionUser.currentUserId
                    ? 'cursor-not-allowed bg-slate-200 text-slate-500'
                    : currentUserVoteNomineeId
                      ? 'cursor-not-allowed bg-slate-200 text-slate-500'
                    : 'bg-slate-950 text-white hover:bg-slate-800'
                "
                @click="castVote(nominee.id)"
                :disabled="
                  votingId === nominee.id ||
                  nominee.nomineeUserId === sessionUser.currentUserId ||
                  !!currentUserVoteNomineeId
                "
              >
                {{ voteLabel(nominee) }}
              </button>
            </div>
          </div>

          <div class="space-y-4 px-4 py-5 sm:px-5 md:hidden">
            <div class="flex items-start gap-4">
              <div
                class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-lg font-bold text-white"
              >
                {{ index + 1 }}
              </div>
              <div
                class="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-100"
              >
                <button
                  type="button"
                  class="rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-300/70"
                  @click="openProfilePopup(nominee.nomineeName)"
                >
                  <img
                    :src="getProfilePicUrl(nominee.nomineeName)"
                    :alt="nominee.nomineeName"
                    class="h-16 w-16 rounded-2xl object-cover"
                  />
                </button>
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-lg font-semibold text-slate-900">{{ nominee.nomineeName }}</p>
                <p class="mt-1 text-sm text-slate-500">{{ tile?.header }} {{ tile?.title }}</p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="rounded-2xl bg-slate-50 px-4 py-3">
                <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Nominated By
                </p>
                <p class="mt-2 text-sm font-medium text-slate-800">
                  {{ nominee.nominatedByName ?? 'Unknown' }}
                </p>
              </div>

              <div class="rounded-2xl bg-slate-950 px-4 py-3 text-white">
                <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">
                  Votes
                </p>
                <p class="mt-2 text-2xl font-bold leading-none">{{ nominee.votes }}</p>
              </div>
            </div>

            <p
              v-if="nominee.nomineeUserId === sessionUser.currentUserId"
              class="text-xs font-semibold uppercase tracking-[0.16em] text-amber-600"
            >
              You are this nominee
            </p>

            <button
              class="min-h-12 w-full rounded-2xl px-4 py-3 text-sm font-semibold transition"
              :class="
                nominee.nomineeUserId === sessionUser.currentUserId
                  ? 'cursor-not-allowed bg-slate-200 text-slate-500'
                  : currentUserVoteNomineeId
                    ? 'cursor-not-allowed bg-slate-200 text-slate-500'
                  : 'bg-slate-950 text-white hover:bg-slate-800'
              "
              @click="castVote(nominee.id)"
              :disabled="
                votingId === nominee.id ||
                nominee.nomineeUserId === sessionUser.currentUserId ||
                !!currentUserVoteNomineeId
              "
            >
              {{ voteLabel(nominee) }}
            </button>
          </div>
        </article>

        <div
          v-if="categoryData.nominees.length === 0"
          class="p-10 text-center text-sm text-slate-500"
        >
          No nominees yet. Be the first to nominate someone.
        </div>
      </div>
    </div>
  </div>
</template>
