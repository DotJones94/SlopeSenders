<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    text: string | number
    minFontSize?: number
    maxFontSize?: number
    textClass?: string
  }>(),
  {
    minFontSize: 24,
    maxFontSize: 160,
    textClass: '',
  },
)

const containerRef = ref<HTMLElement | null>(null)
const measureRef = ref<HTMLElement | null>(null)
const fontSize = ref(props.maxFontSize)

let resizeObserver: ResizeObserver | null = null

async function updateFontSize() {
  await nextTick()

  if (!containerRef.value || !measureRef.value) return

  const availableWidth = containerRef.value.clientWidth
  if (!availableWidth) return

  measureRef.value.style.fontSize = `${props.maxFontSize}px`
  const measuredWidth = measureRef.value.scrollWidth

  if (!measuredWidth) return

  const fittedFontSize = (availableWidth / measuredWidth) * props.maxFontSize
  fontSize.value = Math.max(props.minFontSize, Math.min(props.maxFontSize, fittedFontSize))
}

watch(
  () => [props.text, props.minFontSize, props.maxFontSize, props.textClass],
  () => {
    updateFontSize()
  },
)

onMounted(() => {
  resizeObserver = new ResizeObserver(() => {
    updateFontSize()
  })

  if (containerRef.value) {
    resizeObserver.observe(containerRef.value)
  }

  updateFontSize()
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})
</script>

<template>
  <div ref="containerRef" class="relative w-full">
    <span
      ref="measureRef"
      aria-hidden="true"
      class="pointer-events-none absolute left-0 top-0 invisible whitespace-nowrap"
      :class="textClass"
    >
      {{ text }}
    </span>

    <span
      class="block w-full whitespace-nowrap"
      :class="textClass"
      :style="{ fontSize: `${fontSize}px` }"
    >
      {{ text }}
    </span>
  </div>
</template>
