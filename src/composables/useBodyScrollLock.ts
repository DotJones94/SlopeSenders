import { onBeforeUnmount, watch, type Ref } from 'vue'

export function useBodyScrollLock(active: Ref<boolean>) {
  watch(
    active,
    (isActive) => {
      if (typeof document === 'undefined') return
      document.body.style.overflow = isActive ? 'hidden' : ''
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    if (typeof document === 'undefined') return
    document.body.style.overflow = ''
  })
}
