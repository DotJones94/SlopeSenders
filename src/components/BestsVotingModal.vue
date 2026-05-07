<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  getNomineesBySlug,
  nominateBySlug,
  vote,
  type CategoryPayload,
  type Nominee,
} from '@/api'
import { useBodyScrollLock } from '@/composables/useBodyScrollLock'
import { useSessionUserStore } from '@/stores/sessionUser'
import { dispatchBestsVotesUpdatedEvent, getBestCategories } from '@/utils/bests'
import { getProfilePicUrl } from '@/utils/profilePics'

type BestVoteCategoryState = {
  title: string
  header: string
  description: string
  slug: string
  imageUrl?: string
  nominees: Nominee[]
  selectedUserId: number | null
  existingVoteNomineeId: number | null
  existingVoteUserId: number | null
  isMissing: boolean
}

const sessionUser = useSessionUserStore()

const categories = ref<BestVoteCategoryState[]>([])
const loading = ref(false)
const hasStarted = ref(false)
const error = ref<string | null>(null)
const submitError = ref<string | null>(null)
const submitting = ref(false)
const activeIndex = ref(0)
const hasIncompleteVotes = ref(false)
const lastLoadedUserId = ref<number | null>(null)

const activeCategory = computed(() => categories.value[activeIndex.value] ?? null)
const totalCategories = computed(() => categories.value.length)
const missingCount = computed(() => categories.value.filter((category) => category.isMissing).length)
const activeCategoryExistingVoteName = computed(() => {
  if (!activeCategory.value?.existingVoteUserId) {
    return null
  }

  return (
    sessionUser.users.find((user) => user.id === activeCategory.value?.existingVoteUserId)?.name ??
    'Unknown rider'
  )
})
const introImageUrl = getImageUrl('improved.png')
const showModal = computed(
  () =>
    sessionUser.loaded &&
    !!sessionUser.currentUserId &&
    hasIncompleteVotes.value &&
    categories.value.length > 0,
)

useBodyScrollLock(showModal)

function getImageUrl(imageName?: string): string | undefined {
  if (!imageName) return undefined
  return new URL(`../assets/images/${imageName}`, import.meta.url).href
}

function normalizeVoteCategory(payload: CategoryPayload) {
  const template = getBestCategories().find((category) => category.slug === payload.category.slug)
  const existingVote = payload.nominees.find(
    (nominee) => nominee.id === payload.currentUserVoteNomineeId,
  )

  return {
    title: payload.category.name,
    header: template?.header ?? 'Cast your vote',
    description: template?.description ?? '',
    slug: payload.category.slug,
    imageUrl: getImageUrl(template?.image),
    nominees: payload.nominees,
    selectedUserId: existingVote?.nomineeUserId ?? null,
    existingVoteNomineeId: existingVote?.id ?? null,
    existingVoteUserId: existingVote?.nomineeUserId ?? null,
    isMissing: !existingVote,
  }
}

function resetWizard() {
  hasStarted.value = false
  activeIndex.value = 0
  error.value = null
  submitError.value = null
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

function getSelectableUsers() {
  return sessionUser.users.filter((user) => user.id !== sessionUser.currentUserId)
}

function selectUser(category: BestVoteCategoryState, userId: number) {
  if (submitting.value || !category.isMissing) return
  category.selectedUserId = userId
  submitError.value = null
}

async function loadCategoriesForUser(userId: number) {
  loading.value = true
  error.value = null
  submitError.value = null

  try {
    const bestCategories = getBestCategories()
    const payloads = await Promise.all(
      bestCategories.map((category) => getNomineesBySlug(category.slug, userId)),
    )

    categories.value = payloads.map((payload) => normalizeVoteCategory(payload))
    hasIncompleteVotes.value = categories.value.some((category) => category.isMissing)
    lastLoadedUserId.value = userId

    if (!hasIncompleteVotes.value) {
      resetWizard()
    }
  } catch (err) {
    categories.value = []
    hasIncompleteVotes.value = false
    error.value = err instanceof Error ? err.message : 'Failed to load your bests ballot'
  } finally {
    loading.value = false
  }
}

async function ensureNomineeIdForSelection(category: BestVoteCategoryState, voterUserId: number) {
  const selectedUserId = category.selectedUserId

  if (!selectedUserId) {
    throw new Error('Please choose someone before submitting.')
  }

  const existingNominee = category.nominees.find(
    (nominee) => nominee.nomineeUserId === selectedUserId,
  )

  if (existingNominee) {
    return existingNominee.id
  }

  const createdNominee = await nominateBySlug(category.slug, selectedUserId, voterUserId)
  return createdNominee.id
}

async function submitAllVotes() {
  if (!sessionUser.currentUserId) return

  for (const [index, category] of categories.value.entries()) {
    if (!category.isMissing) continue

    if (!category.selectedUserId) {
      activeIndex.value = index
      submitError.value = 'Please choose a rider for every category before submitting.'
      return
    }
  }

  submitting.value = true
  submitError.value = null

  try {
    for (const category of categories.value) {
      if (!category.isMissing) continue

      const nomineeId = await ensureNomineeIdForSelection(category, sessionUser.currentUserId)
      const result = await vote(nomineeId, sessionUser.currentUserId)

      if (result.duplicate) {
        continue
      }
    }

    dispatchBestsVotesUpdatedEvent()
    await loadCategoriesForUser(sessionUser.currentUserId)
  } catch (err) {
    submitError.value = err instanceof Error ? err.message : 'Failed to submit your votes'
  } finally {
    submitting.value = false
  }
}

watch(
  () => [sessionUser.loaded, sessionUser.currentUserId] as const,
  async ([loaded, userId]) => {
    if (!loaded || !userId) {
      categories.value = []
      hasIncompleteVotes.value = false
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
          <div v-if="loading" class="text-sm text-slate-300">Checking your bests ballot...</div>

          <div
            v-else-if="error"
            class="rounded-2xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-100"
          >
            {{ error }}
          </div>

          <template v-else-if="!hasStarted">
            <h2 class="text-2xl font-semibold text-white sm:text-3xl">Cast your bests votes</h2>
            <p class="mt-3 text-sm leading-6 text-slate-300">
              We found {{ missingCount }} bests
              {{ missingCount === 1 ? 'category' : 'categories' }} still missing for
              {{ sessionUser.currentUser?.name }}. We’ll go one category at a time so you can lock
              in a vote for every award.
            </p>

            <div
              class="mt-5 rounded-3xl border border-cyan-300/20 bg-gradient-to-br from-cyan-300/20 to-sky-500/10 p-4 sm:p-5"
            >
              <div class="flex items-center gap-4">
                <div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                  <img :src="introImageUrl" alt="Bests voting" class="h-12 w-12 object-contain" />
                </div>
                <div>
                  <p class="text-sm font-semibold text-white">Pick one rider per award</p>
                  <p class="mt-1 text-sm leading-6 text-cyan-50/90">
                    We’ll save one vote in each category, and you won’t be able to vote for
                    yourself.
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
              <p class="text-sm font-medium text-white">Choose another rider</p>
              <p class="mt-2 text-xs leading-5 text-slate-400 sm:text-sm">
                {{
                  activeCategory.existingVoteUserId
                    ? `Current saved vote: ${activeCategoryExistingVoteName}`
                    : 'Select one rider from the crew below. You cannot vote for yourself.'
                }}
              </p>

              <div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <button
                  v-for="user in getSelectableUsers()"
                  :key="user.id"
                  type="button"
                  class="flex flex-col items-center gap-3 rounded-2xl border px-3 py-4 text-center transition"
                  :class="
                    activeCategory.selectedUserId === user.id
                      ? 'border-cyan-300 bg-cyan-300/15 text-white'
                      : 'border-white/10 bg-slate-950/60 text-slate-200 hover:border-cyan-300/60 hover:bg-white/5'
                  "
                  :disabled="submitting || !activeCategory.isMissing"
                  @click="selectUser(activeCategory, user.id)"
                >
                  <img
                    :src="getProfilePicUrl(user.name)"
                    :alt="user.name"
                    class="h-16 w-16 rounded-2xl object-cover ring-1 ring-white/10"
                  />
                  <span class="text-sm font-medium">{{ user.name }}</span>
                </button>
              </div>
            </div>

            <p
              v-if="submitError"
              class="mt-4 rounded-2xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-100"
            >
              {{ submitError }}
            </p>

            <p
              v-else-if="!activeCategory.isMissing"
              class="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm text-cyan-50"
            >
              This category already has your saved vote, so it’s here for review only.
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
              @click="submitAllVotes"
            >
              {{ submitting ? 'Submitting...' : 'Submit' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
