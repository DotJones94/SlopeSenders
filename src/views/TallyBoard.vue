<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  getIcks,
  getMetricsBySlug,
  getNomineesBySlug,
  type IckEntry,
  type MetricEntry,
  type Nominee,
} from '@/api'
import { getBestCategories } from '@/utils/bests'
import { BESTS_VOTES_UPDATED_EVENT } from '@/utils/bests'
import { ICKS_UPDATED_EVENT } from '@/utils/icks'
import { getMetricCategories, METRICS_UPDATED_EVENT } from '@/utils/metrics'
import { getProfilePicUrl } from '@/utils/profilePics'

type RankedMetricCategory = {
  title: string
  description: string
  slug: string
  unitLabel: string
  leaders: MetricEntry[]
}

type RankedBestCategory = {
  title: string
  description: string
  slug: string
  nominees: Nominee[]
}

type RankedIckTarget = {
  targetUserId: number
  targetUserName: string
  count: number
  imageUrl: string
  entries: IckEntry[]
}

const loading = ref(true)
const error = ref<string | null>(null)
const metricCategories = ref<RankedMetricCategory[]>([])
const bestCategories = ref<RankedBestCategory[]>([])
const ickTargets = ref<RankedIckTarget[]>([])

const totalMetricSubmissions = computed(() =>
  metricCategories.value.reduce((sum, category) => sum + category.leaders.length, 0),
)

const totalVotes = computed(() =>
  bestCategories.value.reduce(
    (sum, category) => sum + category.nominees.reduce((categorySum, nominee) => categorySum + nominee.votes, 0),
    0,
  ),
)

const totalIcks = computed(() => ickTargets.value.reduce((sum, target) => sum + target.count, 0))

function formatMetricValue(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function groupIcks(entries: IckEntry[]) {
  const grouped = new Map<number, RankedIckTarget>()

  for (const entry of entries) {
    const existing = grouped.get(entry.targetUserId)

    if (existing) {
      existing.count += 1
      existing.entries.push(entry)
      continue
    }

    grouped.set(entry.targetUserId, {
      targetUserId: entry.targetUserId,
      targetUserName: entry.targetUserName,
      count: 1,
      imageUrl: getProfilePicUrl(entry.targetUserName),
      entries: [entry],
    })
  }

  return [...grouped.values()].sort((a, b) => b.count - a.count || a.targetUserName.localeCompare(b.targetUserName))
}

async function loadTallies() {
  loading.value = true
  error.value = null

  try {
    const metricTemplates = getMetricCategories()
    const bestTemplates = getBestCategories()

    const [metricPayloads, bestPayloads, icks] = await Promise.all([
      Promise.all(metricTemplates.map((metric) => getMetricsBySlug(metric.slug))),
      Promise.all(bestTemplates.map((category) => getNomineesBySlug(category.slug))),
      getIcks(),
    ])

    metricCategories.value = metricTemplates.map((metric, index) => ({
      title: metric.title,
      description: metric.description,
      slug: metric.slug,
      unitLabel: metric.unitLabel,
      leaders: [...(metricPayloads[index]?.entries ?? [])].filter((entry) => entry.updatedAt),
    }))

    bestCategories.value = bestTemplates.map((category, index) => ({
      title: category.title,
      description: category.description,
      slug: category.slug,
      nominees: [...(bestPayloads[index]?.nominees ?? [])],
    }))

    ickTargets.value = groupIcks(icks)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load tallies'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  window.addEventListener(METRICS_UPDATED_EVENT, loadTallies)
  window.addEventListener(BESTS_VOTES_UPDATED_EVENT, loadTallies)
  window.addEventListener(ICKS_UPDATED_EVENT, loadTallies)
  void loadTallies()
})

onBeforeUnmount(() => {
  window.removeEventListener(METRICS_UPDATED_EVENT, loadTallies)
  window.removeEventListener(BESTS_VOTES_UPDATED_EVENT, loadTallies)
  window.removeEventListener(ICKS_UPDATED_EVENT, loadTallies)
})
</script>

<template>
  <main class="min-h-screen bg-night px-4 py-8 sm:px-6 lg:px-10">
    <div class="mx-auto max-w-7xl space-y-8">
      <section
        class="overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(236,72,153,0.22),_transparent_35%),linear-gradient(160deg,_rgba(13,18,40,0.96),_rgba(8,10,24,0.98))] p-6 shadow-cta sm:p-8"
      >
        <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-3xl space-y-3">
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-brand-lavender/80">
              Scoreboard
            </p>
            <h1 class="text-4xl font-semibold text-white sm:text-5xl">Season Tallies</h1>
            <p class="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Every metric, every bests vote, and every submitted ick in one place, ranked from
              highest to lowest for each category.
            </p>
          </div>
          <div class="flex flex-wrap gap-3">
            <RouterLink
              to="/"
              class="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/5"
            >
              Back Home
            </RouterLink>
            <RouterLink
              to="/stats"
              class="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
            >
              Personal Stats
            </RouterLink>
          </div>
        </div>

        <div class="mt-8 grid gap-4 sm:grid-cols-3">
          <div class="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p class="text-xs uppercase tracking-[0.22em] text-slate-400">Metric Entries</p>
            <p class="mt-2 text-3xl font-semibold text-white">{{ totalMetricSubmissions }}</p>
          </div>
          <div class="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p class="text-xs uppercase tracking-[0.22em] text-slate-400">Bests Votes</p>
            <p class="mt-2 text-3xl font-semibold text-white">{{ totalVotes }}</p>
          </div>
          <div class="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p class="text-xs uppercase tracking-[0.22em] text-slate-400">Total Icks</p>
            <p class="mt-2 text-3xl font-semibold text-white">{{ totalIcks }}</p>
          </div>
        </div>
      </section>

      <section
        v-if="loading"
        class="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center text-slate-300"
      >
        Loading the latest tallies...
      </section>

      <section
        v-else-if="error"
        class="rounded-[2rem] border border-rose-400/30 bg-rose-400/10 p-8 text-center text-rose-100"
      >
        {{ error }}
      </section>

      <template v-else>
        <section class="space-y-4">
          <div class="flex items-end justify-between gap-4">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.22em] text-brand-lavender/80">
                The Metrics
              </p>
              <h2 class="text-2xl font-semibold text-white">Leaderboard by category</h2>
            </div>
          </div>

          <div class="grid gap-5 lg:grid-cols-2">
            <article
              v-for="category in metricCategories"
              :key="category.slug"
              class="rounded-[2rem] border border-white/10 bg-white/5 p-5"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="space-y-2">
                  <h3 class="text-xl font-semibold text-white">{{ category.title }}</h3>
                  <p class="text-sm leading-6 text-slate-400">{{ category.description }}</p>
                </div>
                <RouterLink
                  :to="`/category/${category.slug}`"
                  class="shrink-0 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:border-white/30 hover:bg-white/5"
                >
                  Open
                </RouterLink>
              </div>

              <ol v-if="category.leaders.length" class="mt-5 space-y-3">
                <li
                  v-for="(entry, index) in category.leaders"
                  :key="entry.id"
                  class="flex items-center justify-between gap-4 rounded-3xl border border-white/8 bg-slate-950/60 px-4 py-3"
                >
                  <div class="flex items-center gap-3">
                    <span
                      class="flex h-9 w-9 items-center justify-center rounded-full bg-brand-lavender/20 text-sm font-semibold text-white"
                    >
                      {{ index + 1 }}
                    </span>
                    <img
                      :src="getProfilePicUrl(entry.userName)"
                      :alt="entry.userName"
                      class="h-11 w-11 rounded-full object-cover ring-2 ring-white/10"
                    />
                    <div>
                      <p class="font-semibold text-white">{{ entry.userName }}</p>
                      <p class="text-xs uppercase tracking-[0.18em] text-slate-400">
                        {{ category.unitLabel }}
                      </p>
                    </div>
                  </div>
                  <p class="text-lg font-semibold text-white">
                    {{ formatMetricValue(entry.value) }}
                  </p>
                </li>
              </ol>

              <p v-else class="mt-5 rounded-3xl border border-dashed border-white/10 px-4 py-5 text-sm text-slate-400">
                No metric entries yet.
              </p>
            </article>
          </div>
        </section>

        <section class="space-y-4">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.22em] text-brand-lavender/80">
              The Bests
            </p>
            <h2 class="text-2xl font-semibold text-white">Vote standings by category</h2>
          </div>

          <div class="grid gap-5 lg:grid-cols-2">
            <article
              v-for="category in bestCategories"
              :key="category.slug"
              class="rounded-[2rem] border border-white/10 bg-white/5 p-5"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="space-y-2">
                  <h3 class="text-xl font-semibold text-white">{{ category.title }}</h3>
                  <p class="text-sm leading-6 text-slate-400">{{ category.description }}</p>
                </div>
                <RouterLink
                  :to="`/category/${category.slug}`"
                  class="shrink-0 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:border-white/30 hover:bg-white/5"
                >
                  Open
                </RouterLink>
              </div>

              <ol v-if="category.nominees.length" class="mt-5 space-y-3">
                <li
                  v-for="(nominee, index) in category.nominees"
                  :key="nominee.id"
                  class="flex items-center justify-between gap-4 rounded-3xl border border-white/8 bg-slate-950/60 px-4 py-3"
                >
                  <div class="flex items-center gap-3">
                    <span
                      class="flex h-9 w-9 items-center justify-center rounded-full bg-brand-lavender/20 text-sm font-semibold text-white"
                    >
                      {{ index + 1 }}
                    </span>
                    <img
                      :src="getProfilePicUrl(nominee.nomineeName)"
                      :alt="nominee.nomineeName"
                      class="h-11 w-11 rounded-full object-cover ring-2 ring-white/10"
                    />
                    <div>
                      <p class="font-semibold text-white">{{ nominee.nomineeName }}</p>
                      <p class="text-xs uppercase tracking-[0.18em] text-slate-400">Nominee</p>
                    </div>
                  </div>
                  <p class="text-lg font-semibold text-white">{{ nominee.votes }} votes</p>
                </li>
              </ol>

              <p v-else class="mt-5 rounded-3xl border border-dashed border-white/10 px-4 py-5 text-sm text-slate-400">
                No nominations yet.
              </p>
            </article>
          </div>
        </section>

        <section class="space-y-4">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.22em] text-brand-lavender/80">
              Kangaroo Court
            </p>
            <h2 class="text-2xl font-semibold text-white">All the icks</h2>
          </div>

          <div v-if="ickTargets.length" class="grid gap-5 lg:grid-cols-2">
            <article
              v-for="(target, index) in ickTargets"
              :key="target.targetUserId"
              class="rounded-[2rem] border border-white/10 bg-white/5 p-5"
            >
              <div class="flex items-center justify-between gap-4">
                <div class="flex items-center gap-4">
                  <span
                    class="flex h-10 w-10 items-center justify-center rounded-full bg-rose-400/20 text-sm font-semibold text-white"
                  >
                    {{ index + 1 }}
                  </span>
                  <img
                    :src="target.imageUrl"
                    :alt="target.targetUserName"
                    class="h-14 w-14 rounded-full object-cover ring-2 ring-white/10"
                  />
                  <div>
                    <h3 class="text-xl font-semibold text-white">{{ target.targetUserName }}</h3>
                    <p class="text-sm text-slate-400">{{ target.count }} total icks</p>
                  </div>
                </div>
              </div>

              <ul class="mt-5 space-y-3">
                <li
                  v-for="entry in target.entries"
                  :key="entry.id"
                  class="rounded-3xl border border-white/8 bg-slate-950/60 px-4 py-4"
                >
                  <p class="text-sm leading-6 text-slate-200">{{ entry.text }}</p>
                  <p class="mt-3 text-xs uppercase tracking-[0.18em] text-slate-500">
                    {{ entry.authorUserName }}
                  </p>
                </li>
              </ul>
            </article>
          </div>

          <p v-else class="rounded-[2rem] border border-dashed border-white/10 px-5 py-8 text-sm text-slate-400">
            No icks have been submitted yet.
          </p>
        </section>
      </template>
    </div>
  </main>
</template>
