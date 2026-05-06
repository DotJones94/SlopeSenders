<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useBodyScrollLock } from '@/composables/useBodyScrollLock'
import { useSessionUserStore } from '@/stores/sessionUser'
import { getProfilePicUrl } from '@/utils/profilePics'

const sessionUser = useSessionUserStore()

const showModal = computed(() => sessionUser.loaded && !sessionUser.currentUser)

useBodyScrollLock(showModal)

onMounted(() => {
  sessionUser.loadUsers()
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="showModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-3 py-3 backdrop-blur-sm sm:px-4 sm:py-6"
    >
      <div
        class="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/40"
      >
        <div class="border-b border-white/10 px-5 pb-4 pt-5 sm:px-6 sm:pb-5 sm:pt-6">
          <p class="text-sm uppercase tracking-[0.24em] text-cyan-300">Slope Senders</p>
          <h2 class="mt-3 text-2xl font-semibold text-white sm:text-3xl">Who are you riding as?</h2>
          <p class="mt-3 text-sm leading-6 text-slate-300">
            Pick your name for this session. Once selected, that rider stays locked for this device.
          </p>
        </div>

        <div class="overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
          <div v-if="sessionUser.loading" class="text-sm text-slate-300">Loading crew...</div>

          <div v-else-if="sessionUser.error" class="rounded-2xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-100">
            {{ sessionUser.error }}
          </div>

          <div v-else class="grid gap-3">
            <button
              v-for="user in sessionUser.users"
              :key="user.id"
              type="button"
              class="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-white transition hover:border-cyan-300/70 hover:bg-cyan-300/10"
              @click="sessionUser.selectUser(user.id)"
            >
              <img
                :src="getProfilePicUrl(user.name)"
                :alt="user.name"
                class="h-12 w-12 rounded-2xl object-cover ring-1 ring-white/10"
              />
              <span>{{ user.name }}</span>
            </button>
          </div>

          <p
            v-if="!sessionUser.loading && !sessionUser.error && sessionUser.users.length === 0"
            class="text-sm text-amber-300"
          >
            No users found yet. Add rows to the new `users` table first.
          </p>
        </div>
      </div>
    </div>
  </Teleport>
</template>
