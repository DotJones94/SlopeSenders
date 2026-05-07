<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { createIck, getIcks, getNomineesBySlug, type IckEntry } from '@/api'
import { useBodyScrollLock } from '@/composables/useBodyScrollLock'
import { useSessionUserStore } from '@/stores/sessionUser'
import { getBestCategories } from '@/utils/bests'
import { dispatchIcksUpdatedEvent } from '@/utils/icks'

const sessionUser = useSessionUserStore()

const loading = ref(false)
const error = ref<string | null>(null)
const saveError = ref<string | null>(null)
const saving = ref(false)
const bestsComplete = ref(false)
const existingIcks = ref<IckEntry[]>([])
const selectedUserId = ref<number | null>(null)
const ickText = ref('')
const lastLoadedUserId = ref<number | null>(null)

const showModal = computed(
  () =>
    sessionUser.loaded &&
    !!sessionUser.currentUserId &&
    bestsComplete.value &&
    existingIcks.value.length === 0,
)

useBodyScrollLock(showModal)

async function loadStateForUser(userId: number) {
  loading.value = true
  error.value = null
  saveError.value = null

  try {
    const bestCategories = getBestCategories()
    const bestPayloads = await Promise.all(
      bestCategories.map((category) => getNomineesBySlug(category.slug, userId)),
    )

    bestsComplete.value = bestPayloads.every((payload) => !!payload.currentUserVoteNomineeId)

    if (!bestsComplete.value) {
      existingIcks.value = []
      return
    }

    existingIcks.value = await getIcks(userId)
    lastLoadedUserId.value = userId
  } catch (err) {
    existingIcks.value = []
    bestsComplete.value = false
    error.value = err instanceof Error ? err.message : 'Failed to load icks'
  } finally {
    loading.value = false
  }
}

async function saveFirstIck() {
  if (!sessionUser.currentUserId) return

  if (!selectedUserId.value) {
    saveError.value = 'Please choose a rider first.'
    return
  }

  if (!ickText.value.trim()) {
    saveError.value = 'Please add an ick before continuing.'
    return
  }

  saving.value = true
  saveError.value = null

  try {
    await createIck(selectedUserId.value, sessionUser.currentUserId, ickText.value)
    selectedUserId.value = null
    ickText.value = ''
    existingIcks.value = await getIcks(sessionUser.currentUserId)
    dispatchIcksUpdatedEvent()
  } catch (err) {
    saveError.value = err instanceof Error ? err.message : 'Failed to save this ick'
  } finally {
    saving.value = false
  }
}

watch(
  () => [sessionUser.loaded, sessionUser.currentUserId] as const,
  async ([loaded, userId]) => {
    if (!loaded || !userId) {
      bestsComplete.value = false
      existingIcks.value = []
      selectedUserId.value = null
      ickText.value = ''
      lastLoadedUserId.value = null
      return
    }

    if (lastLoadedUserId.value === userId && existingIcks.value.length > 0) {
      return
    }

    await loadStateForUser(userId)
  },
  { immediate: true },
)
</script>

<template>
  <Teleport to="body">
    <div
      v-if="showModal"
      class="fixed inset-0 z-[58] flex items-center justify-center bg-slate-950/85 px-3 py-3 backdrop-blur-sm sm:px-4 sm:py-6"
    >
      <div
        class="flex max-h-[80vh] w-full max-w-xl flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900 shadow-2xl shadow-black/40"
      >
        <div class="border-b border-white/10 px-5 pb-4 pt-5 sm:px-6 sm:pb-5 sm:pt-6">
          <p class="text-xs uppercase tracking-[0.24em] text-cyan-300 sm:text-sm">Kangaroo Court</p>
        </div>

        <div class="overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
          <div v-if="loading" class="text-sm text-slate-300">
            Checking whether you still owe an ick...
          </div>

          <div
            v-else-if="error"
            class="rounded-2xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-100"
          >
            {{ error }}
          </div>

          <template v-else>
            <h2 class="text-2xl font-semibold text-white sm:text-3xl">Add your first ick</h2>
            <p class="mt-3 text-sm leading-6 text-slate-300">
              Before {{ sessionUser.currentUser?.name }} can head to the dashboard, we need at least
              one mountain ick on the board. Pick a rider, write the charge, and we’ll save it to
              Kangaroo Court.
            </p>

            <div class="mt-6 space-y-4">
              <label class="block">
                <span class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Who is this about?
                </span>
                <select
                  v-model="selectedUserId"
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
                  What is the ick?
                </span>
                <textarea
                  v-model="ickText"
                  rows="5"
                  maxlength="280"
                  class="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm leading-6 text-white outline-none transition focus:border-cyan-300"
                  placeholder="Example: parked it in the middle of the run to fix a glove and created a full bottleneck."
                />
                <p class="mt-2 text-xs text-slate-500">{{ ickText.trim().length }}/280</p>
              </label>
            </div>

            <div
              v-if="saveError"
              class="mt-4 rounded-2xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-100"
            >
              {{ saveError }}
            </div>

            <button
              type="button"
              class="mt-6 inline-flex w-full items-center justify-center rounded-full bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-cyan-300/60"
              :disabled="saving"
              @click="saveFirstIck"
            >
              {{ saving ? 'Saving...' : 'Save first ick' }}
            </button>
          </template>
        </div>
      </div>
    </div>
  </Teleport>
</template>
