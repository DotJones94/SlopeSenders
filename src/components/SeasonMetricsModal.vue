<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getMetricsBySlug, upsertMetricBySlug, type MetricPayload } from '@/api'
import { useBodyScrollLock } from '@/composables/useBodyScrollLock'
import { useSessionUserStore } from '@/stores/sessionUser'
import { dispatchMetricsUpdatedEvent, getMetricCategories, sanitizeMetricInput } from '@/utils/metrics'

type MetricCategoryState = {
  title: string
  header: string
  description: string
  slug: string
  unitLabel: string
  imageUrl?: string
  value: string
  existingValue: string
  isMissing: boolean
}

const sessionUser = useSessionUserStore()

const categories = ref<MetricCategoryState[]>([])
const loading = ref(false)
const hasStarted = ref(false)
const error = ref<string | null>(null)
const submitError = ref<string | null>(null)
const submitting = ref(false)
const activeIndex = ref(0)
const hasIncompleteMetrics = ref(false)
const lastLoadedUserId = ref<number | null>(null)

const activeCategory = computed(() => categories.value[activeIndex.value] ?? null)
const totalCategories = computed(() => categories.value.length)
const missingCount = computed(
  () => categories.value.filter((category) => category.isMissing).length,
)
const introImageUrl = getImageUrl('ruler.png')
const showModal = computed(
  () =>
    sessionUser.loaded &&
    !!sessionUser.currentUserId &&
    hasIncompleteMetrics.value &&
    categories.value.length > 0,
)

useBodyScrollLock(showModal)

function getCurrentUserMetricValue(payload: MetricPayload, userId: number) {
  return payload.entries.find((entry) => entry.userId === userId) ?? null
}

function getImageUrl(imageName?: string): string | undefined {
  if (!imageName) return undefined
  return new URL(`../assets/images/${imageName}`, import.meta.url).href
}

function normalizeMetricCategory(payload: MetricPayload, userId: number) {
  const template = getMetricCategories().find((category) => category.slug === payload.category.slug)
  const entry = getCurrentUserMetricValue(payload, userId)
  const hasSavedValue = !!entry?.updatedAt
  const value = hasSavedValue ? String(entry?.value ?? '') : ''

  return {
    title: payload.category.name,
    header: template?.header ?? 'Your stat',
    description: template?.description ?? '',
    slug: payload.category.slug,
    unitLabel: template?.unitLabel ?? 'total',
    imageUrl: getImageUrl(template?.image),
    value,
    existingValue: value,
    isMissing: !hasSavedValue,
  }
}

function resetWizard() {
  hasStarted.value = false
  activeIndex.value = 0
  error.value = null
  submitError.value = null
}

function validateMetricValue(rawValue: string) {
  const normalizedValue = rawValue.trim()

  if (!normalizedValue) {
    return 'Please enter a value before submitting.'
  }

  const parsedValue = Number(normalizedValue)
  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return 'Please enter a valid non-negative number.'
  }

  return null
}

function startWizard() {
  const firstMissingIndex = categories.value.findIndex((category) => category.isMissing)
  activeIndex.value = firstMissingIndex >= 0 ? firstMissingIndex : 0
  hasStarted.value = true
  submitError.value = null
}

function goPrevious() {
  if (activeIndex.value > 0) {
    activeIndex.value -= 1
    submitError.value = null
  }
}

function goNext() {
  if (activeIndex.value < categories.value.length - 1) {
    activeIndex.value += 1
    submitError.value = null
  }
}

function handleMetricInput(category: MetricCategoryState, event: Event) {
  const target = event.target as HTMLInputElement
  const sanitizedValue = sanitizeMetricInput(target.value)
  category.value = sanitizedValue
  target.value = sanitizedValue
}

async function loadCategoriesForUser(userId: number) {
  loading.value = true
  error.value = null
  submitError.value = null

  try {
    const metricTemplates = getMetricCategories()
    const payloads = await Promise.all(
      metricTemplates.map((category) => getMetricsBySlug(category.slug)),
    )
    categories.value = payloads.map((payload) => normalizeMetricCategory(payload, userId))
    hasIncompleteMetrics.value = categories.value.some((category) => category.isMissing)
    lastLoadedUserId.value = userId

    if (!hasIncompleteMetrics.value) {
      resetWizard()
    }
  } catch (err) {
    categories.value = []
    hasIncompleteMetrics.value = false
    error.value = err instanceof Error ? err.message : 'Failed to load your metrics'
  } finally {
    loading.value = false
  }
}

async function submitAllMetrics() {
  if (!sessionUser.currentUserId) return

  for (const [index, category] of categories.value.entries()) {
    const validationError = validateMetricValue(category.value)
    if (validationError) {
      activeIndex.value = index
      submitError.value = validationError
      return
    }
  }

  submitting.value = true
  submitError.value = null

  try {
    await Promise.all(
      categories.value.map((category) =>
        upsertMetricBySlug(
          category.slug,
          sessionUser.currentUserId as number,
          Number(category.value.trim()),
        ),
      ),
    )

    dispatchMetricsUpdatedEvent()
    await loadCategoriesForUser(sessionUser.currentUserId)
  } catch (err) {
    submitError.value = err instanceof Error ? err.message : 'Failed to save your season data'
  } finally {
    submitting.value = false
  }
}

watch(
  () => [sessionUser.loaded, sessionUser.currentUserId] as const,
  async ([loaded, userId]) => {
    if (!loaded || !userId) {
      categories.value = []
      hasIncompleteMetrics.value = false
      lastLoadedUserId.value = null
      resetWizard()
      return
    }

    if (lastLoadedUserId.value === userId && categories.value.length > 0) {
      return
    }

    resetWizard()
    await loadCategoriesForUser(userId)
  },
  { immediate: true },
)
</script>

<template>
  <Teleport to="body">
    <div
      v-if="showModal"
      class="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/85 px-3 py-3 backdrop-blur-sm sm:px-4 sm:py-6"
    >
      <div
        class="flex max-h-[80vh] w-full max-w-xl flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900 shadow-2xl shadow-black/40"
      >
        <div class="border-b border-white/10 px-5 pb-4 pt-5 sm:px-6 sm:pb-5 sm:pt-6">
          <p class="text-xs uppercase tracking-[0.24em] text-cyan-300 sm:text-sm">Slope Senders</p>
        </div>

        <div class="overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
          <div v-if="loading" class="text-sm text-slate-300">Checking your season metrics...</div>

          <div
            v-else-if="error"
            class="rounded-2xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-100"
          >
            {{ error }}
          </div>

          <template v-else-if="!hasStarted">
            <h2 class="text-2xl font-semibold text-white sm:text-3xl">Add your season's data</h2>
            <p class="mt-3 text-sm leading-6 text-slate-300">
              We found {{ missingCount }} metric
              {{ missingCount === 1 ? 'category' : 'categories' }} still missing for
              {{ sessionUser.currentUser?.name }}. We’ll walk through every metrics category one at
              a time and prefill anything you’ve already entered.
            </p>

            <div
              class="mt-5 rounded-3xl border border-cyan-300/20 bg-gradient-to-br from-cyan-300/20 to-sky-500/10 p-4 sm:p-5"
            >
              <div class="flex items-center gap-4">
                <div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                  <img
                    :src="introImageUrl"
                    alt="Metrics"
                    class="h-12 w-12 object-contain"
                  />
                </div>
                <div>
                  <p class="text-sm font-semibold text-white">One category at a time</p>
                  <p class="mt-1 text-sm leading-6 text-cyan-50/90">
                    Move back and forth, review saved values, then submit everything at the end.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              class="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-cyan-300 px-5 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 sm:w-auto"
              @click="startWizard"
            >
              Start
            </button>
          </template>

          <template v-else-if="activeCategory">
            <div class="flex items-start justify-between gap-3">
              <p class="text-xs uppercase tracking-[0.24em] text-cyan-300 sm:text-sm">
                {{ activeCategory.header }}
              </p>
              <span
                class="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-300 sm:text-xs"
              >
                {{ activeIndex + 1 }} / {{ totalCategories }}
              </span>
            </div>

            <div class="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div
                class="flex h-24 w-24 items-center justify-center self-center rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-3 sm:h-28 sm:w-28 sm:self-auto"
              >
                <img
                  v-if="activeCategory.imageUrl"
                  :src="activeCategory.imageUrl"
                  :alt="activeCategory.title"
                  class="h-full w-full object-contain"
                />
              </div>
              <div class="min-w-0 text-center sm:text-left">
                <h2 class="text-2xl font-semibold text-white sm:text-3xl">
                  {{ activeCategory.title }}
                </h2>
                <p class="mt-3 text-sm leading-6 text-slate-300">
                  {{ activeCategory.description }}
                </p>
              </div>
            </div>

            <div class="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-5">
              <label class="block text-sm font-medium text-white" :for="activeCategory.slug">
                Enter your {{ activeCategory.unitLabel }}
              </label>
              <input
                :id="activeCategory.slug"
                v-model="activeCategory.value"
                type="number"
                min="0"
                step="any"
                inputmode="decimal"
                @input="handleMetricInput(activeCategory, $event)"
                class="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3.5 text-base text-white outline-none transition focus:border-cyan-300/70"
                :placeholder="`Enter your ${activeCategory.unitLabel}`"
                :disabled="submitting"
              />
              <p class="mt-3 text-xs leading-5 text-slate-400 sm:text-sm">
                {{
                  activeCategory.existingValue
                    ? `Current saved value: ${activeCategory.existingValue} ${activeCategory.unitLabel}`
                    : 'No saved value yet for this category.'
                }}
              </p>
            </div>

            <p
              v-if="submitError"
              class="mt-4 rounded-2xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-100"
            >
              {{ submitError }}
            </p>
          </template>
        </div>

        <div
          v-if="!loading && !error && hasStarted && activeCategory"
          class="border-t border-white/10 bg-slate-900/95 px-5 py-4 sm:px-6"
        >
          <div class="flex items-center gap-3">
            <button
              type="button"
              class="flex-1 rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-white transition hover:border-cyan-300/70 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="activeIndex === 0 || submitting"
              @click="goPrevious"
            >
              Previous
            </button>

            <button
              v-if="activeIndex < totalCategories - 1"
              type="button"
              class="flex-1 rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="submitting"
              @click="goNext"
            >
              Next
            </button>

            <button
              v-else
              type="button"
              class="flex-1 rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="submitting"
              @click="submitAllMetrics"
            >
              {{ submitting ? 'Submitting...' : 'Submit' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
