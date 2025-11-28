<script setup lang="ts">
defineProps<{
  color?: string
  colorDark?: string
  flipped?: boolean
}>()
</script>

<template>
  <div
    class="relative w-full overflow-visible h-[140px] sm:h-[120px]"
    :style="flipped ? { transform: 'scaleX(-1)' } : {}"
  >
    <!-- Mobile SVG - simpler, more prominent pattern -->
    <svg
      viewBox="0 0 800 200"
      class="absolute bottom-0 left-0 w-full sm:hidden"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      style="width: 100%; min-width: 100%"
    >
      <!-- Mountain silhouette path for mobile -->
      <path
        d="M0,200 L0,120 L100,80 L200,100 L300,60 L400,90 L500,50 L600,70 L700,40 L800,60 L800,200 Z"
        :fill="colorDark || '#8c85ff'"
      />
      <!-- Additional peaks for more detail -->
      <path
        d="M0,200 L0,140 L80,100 L160,120 L280,80 L400,100 L520,70 L640,90 L760,60 L800,50 L800,200 Z"
        :fill="color || '#8c85ff'"
      />
    </svg>

    <!-- Desktop SVG - extended for large screens -->
    <svg
      viewBox="0 0 2400 200"
      class="absolute bottom-0 left-0 w-full hidden sm:block"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      style="width: 100%; min-width: 100%"
    >
      <!-- Mountain silhouette path - extended for large screens -->
      <path
        d="M0,200 L0,120 L150,80 L300,100 L450,60 L600,90 L750,50 L900,70 L1050,40 L1200,60 L1350,50 L1500,70 L1650,40 L1800,60 L1950,50 L2100,70 L2250,40 L2400,60 L2400,200 Z"
        :fill="colorDark || '#8c85ff'"
      />
      <!-- Additional peaks for more detail - extended for large screens -->
      <path
        d="M0,200 L0,140 L100,100 L200,120 L350,80 L500,100 L650,70 L800,90 L950,60 L1100,80 L1200,50 L1350,70 L1500,90 L1650,60 L1800,80 L1950,50 L2100,70 L2250,90 L2400,50 L2400,200 Z"
        :fill="color || '#8c85ff'"
      />
    </svg>
  </div>
</template>
