<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { getMetricsBySlug, type MetricEntry } from '@/api'
import AutoFitText from '@/components/AutoFitText.vue'
import { useSessionUserStore } from '@/stores/sessionUser'
import { METRICS_UPDATED_EVENT, getMetricCategories } from '@/utils/metrics'

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

const sessionUser = useSessionUserStore()
const loading = ref(true)
const error = ref<string | null>(null)
const metrics = ref<DashboardMetric[]>([])
const openMetricSlugs = ref<string[]>([])

const completedMetrics = computed(
  () => metrics.value.filter((metric) => metric.currentUserEntry?.updatedAt).length,
)

const completionLabel = computed(() => `${completedMetrics.value}/${metrics.value.length || 0}`)

const totals = computed(() => {
  const filledEntries = metrics.value.reduce((total, metric) => total + metric.filledEntries, 0)
  const availableEntries = metrics.value.reduce((total, metric) => total + metric.totalEntries, 0)

  return {
    filledEntries,
    availableEntries,
  }
})

const topMetric = computed(() => {
  return (
    [...metrics.value]
      .filter((metric) => metric.leader && metric.leader.updatedAt)
      .sort((a, b) => Number(b.leader?.value ?? 0) - Number(a.leader?.value ?? 0))[0] ?? null
  )
})

const leaderboardReleaseLabel = 'Released on Sun'

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

function handleMetricsUpdated() {
  loadDashboard()
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
  },
)

onMounted(() => {
  loadDashboard()
  window.addEventListener(METRICS_UPDATED_EVENT, handleMetricsUpdated)
})

onBeforeUnmount(() => {
  window.removeEventListener(METRICS_UPDATED_EVENT, handleMetricsUpdated)
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

            <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <p class="text-[11px] uppercase tracking-[0.22em] text-slate-400">Your progress</p>
                <p class="mt-2 text-2xl font-semibold text-white">{{ completionLabel }}</p>
              </div>
              <div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <p class="text-[11px] uppercase tracking-[0.22em] text-slate-400">Entries logged</p>
                <p class="mt-2 text-2xl font-semibold text-white">{{ totals.filledEntries }}</p>
              </div>
              <div
                class="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 col-span-2 sm:col-span-1"
              >
                <p class="text-[11px] uppercase tracking-[0.22em] text-slate-400">Crew coverage</p>
                <p class="mt-2 text-2xl font-semibold text-white">
                  {{
                    totals.availableEntries
                      ? Math.round((totals.filledEntries / totals.availableEntries) * 100)
                      : 0
                  }}%
                </p>
              </div>
            </div>
          </div>

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

      <section v-else class="mt-8 grid gap-4 pb-8 sm:mt-10 lg:grid-cols-2 xl:grid-cols-3">
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
    </section>
  </main>
</template>
