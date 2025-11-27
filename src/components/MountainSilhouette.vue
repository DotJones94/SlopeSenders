<script setup lang="ts">
defineProps<{
  color?: string
  colorDark?: string
  flipped?: boolean
}>()
</script>

<template>
  <div
    class="relative w-full overflow-hidden"
    style="height: 120px"
    :style="flipped ? { transform: 'scaleX(-1)' } : {}"
  >
    <svg
      viewBox="0 0 1200 200"
      class="absolute bottom-0 w-full"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <!-- Mountain silhouette path -->
      <path
        d="M0,200 L0,120 L150,80 L300,100 L450,60 L600,90 L750,50 L900,70 L1050,40 L1200,60 L1200,200 Z"
        :fill="colorDark || '#8c85ff'"
      />
      <!-- Additional peaks for more detail -->
      <path
        d="M0,200 L0,140 L100,100 L200,120 L350,80 L500,100 L650,70 L800,90 L950,60 L1100,80 L1200,50 L1200,200 Z"
        :fill="color || '#8c85ff'"
      />
    </svg>
  </div>
</template>
