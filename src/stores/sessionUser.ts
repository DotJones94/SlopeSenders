import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { getUsers, type User } from '@/api'

const STORAGE_KEY = 'slopesenders.currentUserId'

export const useSessionUserStore = defineStore('sessionUser', () => {
  const users = ref<User[]>([])
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref<string | null>(null)
  const currentUserId = ref<number | null>(null)
  const currentUser = computed(
    () => users.value.find((user) => user.id === currentUserId.value) ?? null,
  )

  function hydrateSelection() {
    if (typeof window === 'undefined') return
    const raw = window.localStorage.getItem(STORAGE_KEY)
    currentUserId.value = raw ? Number(raw) : null
  }

  function selectUser(userId: number) {
    currentUserId.value = userId
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, String(userId))
    }
  }

  function clearSelection() {
    currentUserId.value = null
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }

  async function loadUsers(force = false) {
    if (loading.value || (loaded.value && !force)) return

    loading.value = true
    error.value = null
    try {
      const fetchedUsers = await getUsers()
      users.value = fetchedUsers
      loaded.value = true

      if (currentUserId.value && !users.value.some((user) => user.id === currentUserId.value)) {
        clearSelection()
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load users'
      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  hydrateSelection()

  return {
    users,
    loading,
    loaded,
    currentUserId,
    currentUser,
    loadUsers,
    selectUser,
    clearSelection,
    error,
  }
})
