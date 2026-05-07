<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import {
  createIck,
  deleteIck,
  getIcks,
  getMetricsBySlug,
  getNomineesBySlug,
  type IckEntry,
  type MetricEntry,
} from '@/api'
import AutoFitText from '@/components/AutoFitText.vue'
import { useSessionUserStore } from '@/stores/sessionUser'
import { METRICS_UPDATED_EVENT, getMetricCategories } from '@/utils/metrics'
import { BESTS_VOTES_UPDATED_EVENT, getBestCategories } from '@/utils/bests'
import { dispatchIcksUpdatedEvent, ICKS_UPDATED_EVENT } from '@/utils/icks'
import { getProfilePicUrl } from '@/utils/profilePics'

type DashboardMetric = {
  title: string
  header: string
  description: string
  slug: string
  unitLabel: string
  imageUrl?: string
  leader: MetricEntry | null
  currentUserEntry: MetricEntry | null
  filledEntries: number
  totalEntries: number
}

type DashboardBestVote = {
  title: string
  description: string
  slug: string
  currentUserVoteName: string | null
  currentUserVoteImageUrl: string | null
}

const sessionUser = useSessionUserStore()
const loading = ref(true)
const error = ref<string | null>(null)
const metrics = ref<DashboardMetric[]>([])
const openMetricSlugs = ref<string[]>([])
const bestVotes = ref<DashboardBestVote[]>([])
const bestVotesLoading = ref(false)
const bestVotesError = ref<string | null>(null)
const bestVotesOpen = ref(false)
const icks = ref<IckEntry[]>([])
const icksLoading = ref(false)
const icksError = ref<string | null>(null)
const selectedIckUserId = ref<number | null>(null)
const newIckText = ref('')
const savingIck = ref(false)
const deletingIckId = ref<number | null>(null)

const topMetric = computed(() => {
  return (
    [...metrics.value]
      .filter((metric) => metric.leader && metric.leader.updatedAt)
      .sort((a, b) => Number(b.leader?.value ?? 0) - Number(a.leader?.value ?? 0))[0] ?? null
  )
})

const leaderboardReleaseLabel = 'Released on Sun'
const hasIcks = computed(() => icks.value.length > 0)
const completedBestVotes = computed(
  () => bestVotes.value.filter((category) => category.currentUserVoteName).length,
)
const dashboardNavItems = computed(() => {
  const items = [
    { id: 'dashboard-metrics', label: 'Metrics' },
    { id: 'dashboard-icks', label: 'Icks' },
  ]

  if (sessionUser.currentUserId) {
    items.push({ id: 'dashboard-bests', label: 'Bests' })
  }

  return items
})

function getImageUrl(imageName?: string): string | undefined {
  if (!imageName) return undefined
  return new URL(`../assets/images/${imageName}`, import.meta.url).href
}

function formatMetricValue(value?: number | null) {
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue)) {
    return '0'
  }

  return Number.isInteger(numericValue) ? String(numericValue) : numericValue.toFixed(1)
}

function buildDashboardMetric(
  metricTemplate: ReturnType<typeof getMetricCategories>[number],
  entries: MetricEntry[],
  currentUserId: number | null,
): DashboardMetric {
  const leader = entries.find((entry) => entry.updatedAt) ?? null
  const currentUserEntry = currentUserId
    ? (entries.find((entry) => entry.userId === currentUserId && entry.updatedAt) ?? null)
    : null
  const filledEntries = entries.filter((entry) => entry.updatedAt).length

  return {
    title: metricTemplate.title,
    header: metricTemplate.header,
    description: metricTemplate.description,
    slug: metricTemplate.slug,
    unitLabel: metricTemplate.unitLabel,
    imageUrl: getImageUrl(metricTemplate.image),
    leader,
    currentUserEntry,
    filledEntries,
    totalEntries: entries.length,
  }
}

async function loadDashboard() {
  loading.value = true
  error.value = null

  try {
    const metricTemplates = getMetricCategories()
    const payloads = await Promise.all(
      metricTemplates.map((metric) => getMetricsBySlug(metric.slug)),
    )

    metrics.value = payloads.map((payload, index) => {
      const metricTemplate = metricTemplates[index]

      if (!metricTemplate) {
        throw new Error(`Missing metric template for index ${index}`)
      }

      return buildDashboardMetric(metricTemplate, payload.entries, sessionUser.currentUserId)
    })

    openMetricSlugs.value = metrics.value
      .filter((metric) => openMetricSlugs.value.includes(metric.slug))
      .map((metric) => metric.slug)

    if (openMetricSlugs.value.length === 0 && metrics.value[0]) {
      openMetricSlugs.value = [metrics.value[0].slug]
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load dashboard metrics'
  } finally {
    loading.value = false
  }
}

async function loadIcks() {
  if (!sessionUser.currentUserId) {
    icks.value = []
    icksError.value = null
    icksLoading.value = false
    return
  }

  icksLoading.value = true
  icksError.value = null

  try {
    icks.value = await getIcks(sessionUser.currentUserId)
  } catch (err) {
    icksError.value = err instanceof Error ? err.message : 'Failed to load your icks'
  } finally {
    icksLoading.value = false
  }
}

async function loadBestVotes() {
  if (!sessionUser.currentUserId) {
    bestVotes.value = []
    bestVotesError.value = null
    bestVotesLoading.value = false
    bestVotesOpen.value = false
    return
  }

  bestVotesLoading.value = true
  bestVotesError.value = null

  try {
    const categories = getBestCategories()
    const payloads = await Promise.all(
      categories.map((category) => getNomineesBySlug(category.slug, sessionUser.currentUserId)),
    )

    bestVotes.value = categories.map((category, index) => {
      const payload = payloads[index]
      const votedNominee =
        payload?.nominees.find((nominee) => nominee.id === payload.currentUserVoteNomineeId) ?? null

      return {
        title: category.title,
        description: category.description,
        slug: category.slug,
        currentUserVoteName: votedNominee?.nomineeName ?? null,
        currentUserVoteImageUrl: votedNominee?.nomineeName
          ? getProfilePicUrl(votedNominee.nomineeName)
          : null,
      }
    })

    if (bestVotes.value.length > 0 && completedBestVotes.value > 0) {
      bestVotesOpen.value = true
    }
  } catch (err) {
    bestVotes.value = []
    bestVotesError.value = err instanceof Error ? err.message : 'Failed to load your bests votes'
  } finally {
    bestVotesLoading.value = false
  }
}

async function saveIck() {
  if (!sessionUser.currentUserId) return

  if (!selectedIckUserId.value) {
    icksError.value = 'Choose a rider before saving an ick.'
    return
  }

  if (!newIckText.value.trim()) {
    icksError.value = 'Write the ick before saving it.'
    return
  }

  savingIck.value = true
  icksError.value = null

  try {
    await createIck(selectedIckUserId.value, sessionUser.currentUserId, newIckText.value)
    selectedIckUserId.value = null
    newIckText.value = ''
    await loadIcks()
    dispatchIcksUpdatedEvent()
  } catch (err) {
    icksError.value = err instanceof Error ? err.message : 'Failed to save your ick'
  } finally {
    savingIck.value = false
  }
}

async function removeIck(id: number) {
  if (!sessionUser.currentUserId) return

  deletingIckId.value = id
  icksError.value = null

  try {
    await deleteIck(id, sessionUser.currentUserId)
    await loadIcks()
    dispatchIcksUpdatedEvent()
  } catch (err) {
    icksError.value = err instanceof Error ? err.message : 'Failed to delete this ick'
  } finally {
    deletingIckId.value = null
  }
}

function formatCreatedAt(value: string) {
  return new Intl.DateTimeFormat('en-CA', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}

function handleMetricsUpdated() {
  loadDashboard()
}

function handleIcksUpdated() {
  loadIcks()
}

function handleBestVotesUpdated() {
  loadBestVotes()
}

function toggleMetric(slug: string) {
  if (openMetricSlugs.value.includes(slug)) {
    openMetricSlugs.value = openMetricSlugs.value.filter((openSlug) => openSlug !== slug)
    return
  }

  openMetricSlugs.value = [...openMetricSlugs.value, slug]
}

function isMetricOpen(slug: string) {
  return openMetricSlugs.value.includes(slug)
}

watch(
  () => sessionUser.currentUserId,
  () => {
    loadDashboard()
    loadBestVotes()
    loadIcks()
  },
)

onMounted(() => {
  loadDashboard()
  loadBestVotes()
  loadIcks()
  window.addEventListener(METRICS_UPDATED_EVENT, handleMetricsUpdated)
  window.addEventListener(BESTS_VOTES_UPDATED_EVENT, handleBestVotesUpdated)
  window.addEventListener(ICKS_UPDATED_EVENT, handleIcksUpdated)
})

onBeforeUnmount(() => {
  window.removeEventListener(METRICS_UPDATED_EVENT, handleMetricsUpdated)
  window.removeEventListener(BESTS_VOTES_UPDATED_EVENT, handleBestVotesUpdated)
  window.removeEventListener(ICKS_UPDATED_EVENT, handleIcksUpdated)
})
</script>

<template>
  <main class="min-h-screen bg-black text-white">
    <section
      class="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-8 sm:px-6 sm:py-10 lg:px-8"
    >
      <div
        class="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),_transparent_32%),linear-gradient(180deg,_rgba(15,23,42,0.96),_rgba(2,6,23,0.98))] px-6 py-8 shadow-[0_30px_100px_rgba(0,0,0,0.45)] sm:px-8 sm:py-10"
      >
        <div
          class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(14,165,233,0.14),_transparent_24%),radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.05),_transparent_28%)]"
        ></div>
        <div class="relative z-10">
          <p class="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">
            Slope Senders
          </p>
          <div class="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div class="max-w-2xl">
              <h1 class="text-3xl font-semibold leading-tight text-white sm:text-5xl">
                Season metrics dashboard
              </h1>
              <p class="mt-4 text-sm leading-6 text-slate-300 sm:text-base">
                A quick read on what the crew has already logged this season, with your own numbers
                highlighted where available.
              </p>
            </div>
          </div>

          <nav
            class="mt-6 flex flex-wrap gap-3"
            aria-label="Dashboard sections"
          >
            <a
              v-for="item in dashboardNavItems"
              :key="item.id"
              :href="`#${item.id}`"
              class="inline-flex items-center gap-3 rounded-full border border-white/10 bg-slate-950/35 px-4 py-2.5 text-sm font-medium text-slate-100 transition hover:border-cyan-300/40 hover:bg-cyan-300/10 hover:text-white"
            >
              <span
                class="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-cyan-200"
              >
                <svg
                  v-if="item.id === 'dashboard-metrics'"
                  class="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 19h16M7 16V9m5 7V5m5 11v-4"
                  />
                </svg>
                <svg
                  v-else-if="item.id === 'dashboard-icks'"
                  class="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 13h6m-6 4h3m-5 4h10a2 2 0 002-2V7l-4-4H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                <svg
                  v-else
                  class="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 15l7-10 7 10M8 15v4h8v-4"
                  />
                </svg>
              </span>
              <span>{{ item.label }}</span>
            </a>
          </nav>

          <div
            v-if="topMetric?.leader"
            class="relative mt-8 overflow-hidden rounded-[1.75rem] border border-cyan-300/20 bg-cyan-300/10 px-5 py-5 sm:px-6"
          >
            <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200">
              Current standout
            </p>
            <div class="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div
                  class="inline-flex rounded-2xl border border-white/10 bg-slate-950/30 px-3 py-2"
                >
                  <h2 class="text-2xl font-semibold text-white blur-[4px] select-none">
                    {{ topMetric.title }}
                  </h2>
                </div>
                <div
                  class="mt-2 inline-flex rounded-2xl border border-white/10 bg-slate-950/30 px-3 py-2"
                >
                  <p class="text-sm text-cyan-50/90 blur-[4px] select-none">
                    {{ topMetric.leader.userName }} leads with
                    {{ formatMetricValue(topMetric.leader.value) }} {{ topMetric.unitLabel }}.
                  </p>
                </div>
                <p class="mt-3 text-sm font-medium text-cyan-100">{{ leaderboardReleaseLabel }}</p>
              </div>
              <span
                class="inline-flex items-center justify-center rounded-2xl border border-cyan-200/20 bg-white/5 px-4 py-2 text-sm font-medium text-white/65 backdrop-blur-sm"
              >
                {{ leaderboardReleaseLabel }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="loading" class="flex flex-1 items-center justify-center py-16">
        <div class="text-center">
          <div
            class="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-cyan-300"
          ></div>
          <p class="mt-4 text-sm text-slate-400">Loading the latest season numbers...</p>
        </div>
      </div>

      <div
        v-else-if="error"
        class="mt-8 rounded-[1.75rem] border border-rose-400/20 bg-rose-400/10 p-5 text-sm text-rose-100"
      >
        {{ error }}
      </div>

      <section
        id="dashboard-metrics"
        v-else
        class="mt-8 scroll-mt-6 grid gap-4 pb-8 sm:mt-10 lg:grid-cols-2 xl:grid-cols-3"
      >
        <article
          v-for="metric in metrics"
          :key="metric.slug"
          class="group relative overflow-hidden rounded-[1.85rem] border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] transition hover:border-cyan-300/30 hover:bg-white/[0.06] sm:p-6"
        >
          <div
            class="absolute right-4 top-4 h-20 w-20 rounded-full bg-cyan-300/10 blur-2xl transition group-hover:bg-cyan-300/20"
          ></div>
          <div class="relative z-10">
            <button
              type="button"
              class="flex w-full items-start justify-between gap-4 text-left"
              @click="toggleMetric(metric.slug)"
            >
              <div class="min-w-0">
                <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300">
                  {{ metric.header }}
                </p>
                <h2 class="mt-2 text-2xl font-semibold text-white">{{ metric.title }}</h2>
              </div>
              <div class="flex items-start gap-3">
                <div
                  class="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-2"
                >
                  <img
                    v-if="metric.imageUrl"
                    :src="metric.imageUrl"
                    :alt="metric.title"
                    class="h-full w-full object-contain"
                  />
                </div>
                <span
                  class="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition"
                >
                  <svg
                    class="h-5 w-5 transition-transform duration-200"
                    :class="isMetricOpen(metric.slug) ? 'rotate-180' : ''"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </span>
              </div>
            </button>

            <div v-if="isMetricOpen(metric.slug)" class="mt-3">
              <p class="mb-3 text-sm leading-6 text-slate-300">{{ metric.description }}</p>

              <div class="grid grid-cols-2 gap-3">
                <div class="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-4">
                  <p class="text-[11px] uppercase tracking-[0.22em] text-slate-500">Your stat</p>
                  <div class="mt-3">
                    <AutoFitText
                      :text="
                        metric.currentUserEntry
                          ? formatMetricValue(metric.currentUserEntry.value)
                          : 'Not added'
                      "
                      :min-font-size="22"
                      :max-font-size="88"
                      text-class="font-semibold leading-none tracking-tight text-white"
                    />
                  </div>
                  <p class="mt-1 text-xs text-slate-400">{{ metric.unitLabel }}</p>
                </div>
                <div class="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-4">
                  <p class="text-[11px] uppercase tracking-[0.22em] text-slate-500">Leaderboard</p>
                  <div class="mt-2 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2">
                    <p class="text-xl font-semibold text-white blur-[4px] select-none">
                      {{ metric.leader ? formatMetricValue(metric.leader.value) : 'No data' }}
                    </p>
                    <p class="mt-1 text-xs text-slate-400 blur-[4px] select-none">
                      {{ metric.leader ? metric.leader.userName : 'Waiting on entries' }}
                    </p>
                  </div>
                  <p class="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-cyan-300">
                    {{ leaderboardReleaseLabel }}
                  </p>
                </div>
              </div>

              <div
                class="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
              >
                <div>
                  <p class="text-[11px] uppercase tracking-[0.22em] text-slate-500">Coverage</p>
                  <p class="mt-1 text-sm text-slate-300">
                    {{ metric.filledEntries }} of {{ metric.totalEntries }} riders entered data
                  </p>
                </div>
                <span
                  class="inline-flex shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/60 backdrop-blur-sm"
                >
                  {{ leaderboardReleaseLabel }}
                </span>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section
        v-if="sessionUser.currentUserId"
        id="dashboard-icks"
        class="mb-10 scroll-mt-6 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] sm:p-6"
      >
        <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300">
              Kangaroo Court
            </p>
            <h2 class="mt-2 text-2xl font-semibold text-white">Your icks</h2>
            <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Add more mountain misdemeanours here anytime. Everything below is tied to
              {{ sessionUser.currentUser?.name }} and can be removed later if needed.
            </p>
          </div>
          <div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
            <p class="text-[11px] uppercase tracking-[0.22em] text-slate-400">Icks logged</p>
            <p class="mt-2 text-2xl font-semibold text-white">{{ icks.length }}</p>
          </div>
        </div>

        <div class="mt-6 grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div class="rounded-[1.75rem] border border-white/10 bg-slate-950/50 p-5">
            <p class="text-sm font-semibold text-white">Add a new ick</p>
            <div class="mt-4 space-y-4">
              <label class="block">
                <span class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Rider
                </span>
                <select
                  v-model="selectedIckUserId"
                  class="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300"
                >
                  <option :value="null">Select a rider</option>
                  <option v-for="user in sessionUser.users" :key="user.id" :value="user.id">
                    {{ user.name }}
                  </option>
                </select>
              </label>

              <label class="block">
                <span class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Ick
                </span>
                <textarea
                  v-model="newIckText"
                  rows="5"
                  maxlength="280"
                  class="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm leading-6 text-white outline-none transition focus:border-cyan-300"
                  placeholder="Write the charge for Kangaroo Court..."
                />
                <p class="mt-2 text-xs text-slate-500">{{ newIckText.trim().length }}/280</p>
              </label>
            </div>

            <div
              v-if="icksError"
              class="mt-4 rounded-2xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-100"
            >
              {{ icksError }}
            </div>

            <button
              type="button"
              class="mt-5 inline-flex items-center justify-center rounded-full bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-cyan-300/60"
              :disabled="savingIck"
              @click="saveIck"
            >
              {{ savingIck ? 'Saving...' : 'Add ick' }}
            </button>
          </div>

          <div class="rounded-[1.75rem] border border-white/10 bg-slate-950/50 p-5">
            <div v-if="icksLoading" class="text-sm text-slate-300">Loading your saved icks...</div>

            <div
              v-else-if="!hasIcks"
              class="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-slate-400"
            >
              No icks added yet. Once you add one, it will show up here with a delete action.
            </div>

            <div v-else class="space-y-3">
              <article
                v-for="entry in icks"
                :key="entry.id"
                class="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
              >
                <div class="flex items-start justify-between gap-4">
                  <div class="flex items-start gap-3">
                    <img
                      :src="getProfilePicUrl(entry.targetUserName)"
                      :alt="entry.targetUserName"
                      class="h-12 w-12 shrink-0 rounded-2xl border border-white/10 object-cover"
                    />
                    <div>
                      <p class="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                        {{ entry.targetUserName }}
                      </p>
                      <p class="mt-2 text-sm leading-6 text-slate-200">{{ entry.text }}</p>
                      <p class="mt-3 text-xs text-slate-500">
                        Added {{ formatCreatedAt(entry.createdAt) }}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    class="inline-flex shrink-0 items-center justify-center rounded-full border border-rose-300/30 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-rose-100 transition hover:border-rose-300/60 hover:bg-rose-300/10 disabled:cursor-not-allowed disabled:opacity-60"
                    :disabled="deletingIckId === entry.id"
                    @click="removeIck(entry.id)"
                  >
                    {{ deletingIckId === entry.id ? 'Deleting...' : 'Delete' }}
                  </button>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section
        v-if="sessionUser.currentUserId"
        id="dashboard-bests"
        class="mb-8 scroll-mt-6 rounded-[2rem] border border-cyan-300/10 bg-cyan-300/[0.06] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] sm:p-6"
      >
        <button
          type="button"
          class="flex w-full items-start justify-between gap-4 text-left"
          @click="bestVotesOpen = !bestVotesOpen"
        >
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300">
              The Bests
            </p>
            <h2 class="mt-2 text-2xl font-semibold text-white">Your bests votes</h2>
            <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              One dropdown with every bests category, its description, and who
              {{ sessionUser.currentUser?.name }} has voted for.
            </p>
          </div>

          <span
            class="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition"
          >
            <svg
              class="h-5 w-5 transition-transform duration-200"
              :class="bestVotesOpen ? 'rotate-180' : ''"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </span>
        </button>

        <div v-if="bestVotesOpen" class="mt-6">
          <div v-if="bestVotesLoading" class="text-sm text-slate-300">Loading your bests votes...</div>

          <div
            v-else-if="bestVotesError"
            class="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-100"
          >
            {{ bestVotesError }}
          </div>

          <div
            v-else-if="!bestVotes.length"
            class="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-slate-400"
          >
            No bests categories found yet.
          </div>

          <div v-else class="space-y-3">
            <article
              v-for="category in bestVotes"
              :key="category.slug"
              class="rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-4 sm:p-5"
            >
              <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div class="min-w-0">
                  <h3 class="text-lg font-semibold text-white">{{ category.title }}</h3>
                  <p class="mt-2 text-sm leading-6 text-slate-300">{{ category.description }}</p>
                </div>

                <div
                  class="shrink-0 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 sm:min-w-[220px]"
                >
                  <p class="text-[11px] uppercase tracking-[0.22em] text-slate-500">Your vote</p>
                  <div class="mt-2 flex items-center gap-3">
                    <img
                      v-if="category.currentUserVoteImageUrl && category.currentUserVoteName"
                      :src="category.currentUserVoteImageUrl"
                      :alt="category.currentUserVoteName"
                      class="h-11 w-11 rounded-2xl border border-white/10 object-cover"
                    />
                    <div>
                      <p class="text-sm font-semibold text-white">
                        {{ category.currentUserVoteName ?? 'No vote saved yet' }}
                      </p>
                      <p
                        v-if="!category.currentUserVoteName"
                        class="mt-1 text-xs text-slate-400"
                      >
                        Picked rider will show here once a vote is saved.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>
    </section>
  </main>
</template>
